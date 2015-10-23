# Source Server Stats
# File: sourcestats/collector/__init__.py
# Desc: the collector

from __future__ import division

import json
from time import time
from datetime import datetime
from collections import deque

import gevent
from gevent.queue import Queue, Empty as QueueEmpty
from gevent.pool import Pool
from valve.source.master_server import MasterServerQuerier
from valve.source.a2s import ServerQuerier, NoResponseError
from valve.source.messages import BrokenMessageError
from elasticsearch.helpers import bulk
from elasticsearch.exceptions import NotFoundError

from sourcestats import settings, logger
from sourcestats.app import redis_client
from sourcestats.util import hash_address, get_source_apps
from sourcestats.util.elastic import get_es_client

from .cache import get_collector_state, set_collector_state

source_apps = get_source_apps()

collect_pool = Pool(settings.PARALLEL)
find_pool = Pool(len(settings.VALVE_HOSTS))

index_queue = Queue()

addresses = set()
address_blacklist = set()


def wait_for_collect():
    '''
    If the last collect start was within COLLECT_INTERVAL and the collector was not
    running (ie complete), we wait.

    This means a minimum of 5 mins between runs even through restarts.
    '''
    state = get_collector_state()

    # We assume the collector is running when there's no cache
    running = state.get('running', True)

    if 'last_start' in state:
        now = datetime.now()
        diff = now - state['last_start']

        if not running and diff.seconds < settings.COLLECT_INTERVAL:
            sleep_time = settings.COLLECT_INTERVAL - diff.seconds

            logger.info('Last collector instance finished {0}s ago, sleeping {1}s'.format(
                diff.seconds, sleep_time
            ))

            gevent.sleep(sleep_time)


def load_cached_addresses():
    '''Populate the __init__'s address set from Redis.'''
    redis_addresses = redis_client.smembers(settings.REDIS_ADDRESS_SET)
    for address in redis_addresses:
        host, port = json.loads(address)
        addresses.add((host, port))

    return len(redis_addresses)


def _cache_address(address):
    redis_client.sadd(
        settings.REDIS_ADDRESS_SET,
        json.dumps(address)
    )


def _find_servers(host, region):
    count = 0
    logger.info(
        'Querying master server {0} for region: {1}...'.format(host, region)
    )

    master = MasterServerQuerier(address=(host, 27011), timeout=settings.MASTER_TIMEOUT)

    try:
        for address in master.find(region=[region]):
            if address in addresses or address in address_blacklist:
                continue

            logger.debug('Adding address #{0}: {1}'.format(len(addresses), address))
            addresses.add(address)
            _cache_address(address)
            count += 1

    except NoResponseError as e:
        # Protocol is UDP so there's no "end"
        if u'Timed out' not in e.message:
            logger.warning('Error querying master server: {0}'.format(e))

    finally:
        logger.info('Found {0} addresses'.format(count))


def find():
    '''
    Reads server addresses from the Source Master server and adds them to the
    addresses set.
    '''
    hosts = deque(settings.VALVE_HOSTS)

    for region in settings.VALVE_REGIONS:
        hosts.rotate(1)
        host = hosts[0]

        find_pool.spawn(_find_servers, host, region)

    find_pool.join()


def _collect_stats(address):
    server = ServerQuerier(address, timeout=settings.SERVER_TIMEOUT)

    def blacklist(reason):
        addresses.remove(address)
        address_blacklist.add(address)
        logger.debug('Blacklisting {0}: {1}'.format(reason, address))

    try:
        stats = {
            'ping': server.ping(),
            'info': server.get_info(),
            'players': server.get_players()
        }

        # We're only interested in source apps
        if stats['info']['app_id'] not in source_apps:
            blacklist('as not source')
            return

        # Index the stats in indexer greenlet
        index_queue.put_nowait((address, stats))

        logger.debug('Updated {0}:{1}'.format(*address))
        return True

    # python-valve doesn't support compressed fragments
    except NotImplementedError:
        blacklist('for NotImplemented')

    # Somtimes servers return invalid server types
    except ValueError as e:
        if 'Invalid server type' in e.message:
            blacklist('for invalid server type')

        # But we don't want to blanket capture all ValueErrors
        else:
            raise ValueError(e.message)

    except (NoResponseError, BrokenMessageError):
        # UDP is flakey
        pass


def collect():
    '''Loops through the address set and collects stats from them.'''

    while not addresses:
        gevent.sleep(1)

    # Set collector to running in the cache
    set_collector_state(True)

    addresses_copy = addresses.copy()
    # Remove any blacklisted addresses
    addresses_copy -= address_blacklist

    n_addresses = len(addresses_copy)

    logger.info(
        'Beginning collection run on {0} addresses'.format(n_addresses)
    )

    start = time()
    greenlets = []

    for address in addresses_copy:
        greenlets.append(
            collect_pool.spawn(_collect_stats, address)
        )

    collect_pool.join()

    # Count the successful collects
    results = [greenlet.get() for greenlet in greenlets]
    results = filter(None, results)

    time_taken = time() - start

    logger.info('Collected {0}/{1} addresses in {2}s'.format(
        len(results), n_addresses, time_taken)
    )

    index()

    # Set the collector as complete
    set_collector_state(False)


def _get_history_mappings():
    mappings_data = open('mappings/server.json', 'r').read()
    mappings = json.loads(mappings_data)

    return mappings


def _get_current_history_index():
    index_name = '{0}_{1}'.format(
        settings.HISTORY_INDEXES,
        datetime.now().strftime(settings.INDEX_DATE_FORMAT)
    )

    es_client = get_es_client()

    # Check for the index
    try:
        es_client.indices.get(index_name)

    # Create if not existing
    except NotFoundError:
        es_client.indices.create(index_name)

        # Put the mappings
        es_client.indices.put_mapping(
            index=index_name,
            doc_type='server', body=_get_history_mappings()
        )

        # Update the alias
        get_es_client().indices.put_alias(
            index='{0}_*'.format(settings.HISTORY_INDEXES),
            name=settings.HISTORY_INDEXES
        )

    return index_name


def _create_documents(host, port, stats):
    server_hash = hash_address((host, port))
    date_time = datetime.utcnow().replace(microsecond=0)

    ping = stats['ping']
    info = stats['info']
    players = stats['players']

    # Ratio of players:max_players for scoring popularity
    player_ratio = 0

    if info['max_players'] > 0:
        players['player_count'] / info['max_players']

    # These are always logged
    history_stats = {
        'datetime': date_time,
        'server_hash': server_hash,
        'ping': ping,
        'game_id': info['app_id'],
        'gamemode': info['game'],
        'map': info['map'],
        'player_ratio': player_ratio,
        'player_count': players['player_count']
    }

    # This will overwrite the current server index document
    current_stats = history_stats.copy()
    current_stats.update({
        'host': host,
        'port': port,
        'name': info['server_name'],
        'platform': str(info['platform']),
        'server_type': str(info['server_type']),
        'max_players': info['max_players'],
        'players': [
            {
                'name': player['name'],
                'score': player['score']
            }
            for player in players['players']
            if player['name']
        ]
    })

    current_history_index = _get_current_history_index()

    return [{
        # Server document
        '_index': settings.SERVERS_INDEX,
        '_type': 'server',
        '_id': server_hash,
        '_source': current_stats
    }, {
        # History document
        '_index': current_history_index,
        '_type': 'server',
        '_source': history_stats
    }]


def _index_documents(documents):
    es_client = get_es_client()
    logger.info('Indexing {0} documents...'.format(len(documents)))
    start = time()

    num_inserted, errors = bulk(es_client, documents, raise_on_error=False)

    if errors:
        for error in errors:
            logger.error('Indexing error: {0}'.format(error))

    time_taken = time() - start
    logger.info('Indexed {0} documents in {1}s'.format(num_inserted, time_taken))


def index():
    '''
    Reads stats (from _collect_stats above) from a queue and writes them to an
    Elasticsearch index.
    '''
    index_buffer = []

    while True:
        # Get any new document
        try:
            (host, port), stats = index_queue.get_nowait()

        # Or stop the indexer
        except QueueEmpty:
            break

        index_buffer.extend(_create_documents(
            host, port, stats
        ))

        if len(index_buffer) >= settings.ES_BATCH:
            # Index & reset
            _index_documents(index_buffer)
            index_buffer = []

    # Index any remaining documents
    _index_documents(index_buffer)
