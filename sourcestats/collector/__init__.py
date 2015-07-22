# Source Server Stats
# File: sourcestats/collector/__init__.py
# Desc: the collector

from time import time
from datetime import datetime
from collections import deque

from gevent import sleep
from gevent.queue import Queue
from gevent.pool import Pool
from valve.source.master_server import MasterServerQuerier
from valve.source.a2s import ServerQuerier, NoResponseError
from valve.source.messages import BrokenMessageError
from elasticsearch.helpers import bulk

from .. import settings, logger
from ..util import hash_address, get_source_apps
from ..util.elastic import get_es_client


source_apps = get_source_apps()

collect_pool = Pool(settings.PARALLEL)
find_pool = Pool(len(settings.VALVE_HOSTS))

index_queue = Queue()

addresses = set()
address_blacklist = set()


def _collect_stats(address):
    server = ServerQuerier(address, timeout=settings.SERVER_TIMEOUT)

    try:
        stats = {
            # There is a bug in python-valve which divides the ping (in s) by 1000, rather than
            # multiplying to get ms. https://github.com/Holiverh/python-valve/pull/20
            'ping': (server.ping() * 1000 * 1000),
            'info': server.get_info(),
            'players': server.get_players()
        }

        # We're only interested in source apps
        if stats['info']['app_id'] not in source_apps:
            address_blacklist.add(address)
            logger.warning('Blacklisting as not source: {0}'.format(address))
            return

        # Index the stats in indexer greenlet
        index_queue.put_nowait((address, stats))

        logger.debug('Updated {0}:{1}'.format(*address))
        return True

    # python-valve doesn't support compressed fragments
    except NotImplementedError:
        addresses.remove(address)
        address_blacklist.add(address)
        logger.warning('Blacklisting for NotImplemented: {0}'.format(address))

    except (NoResponseError, BrokenMessageError):
        # UDP is flakey
        pass


def collect():
    '''Continually loops through the address set and collects stats from them.'''
    sleep(30)

    while True:
        while not addresses:
            sleep(1)

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

        sleep(settings.COLLECT_INTERVAL)


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

    while True:
        for region in settings.VALVE_REGIONS:
            hosts.rotate(1)
            host = hosts[0]

            find_pool.spawn(_find_servers, host, region)

        find_pool.join()
        sleep(settings.FIND_INTERVAL)


def index():
    '''
    Reads stats (from _collect_stats above) from a queue and writes them to an
    Elasticsearch index.
    '''
    es_client = get_es_client()
    index_buffer = []

    while True:
        # Index a batch if possible
        index_buffer_count = len(index_buffer)
        # Add 2 for the documents we're about to append
        index_buffer_count += 2

        if index_buffer_count > settings.ES_BATCH:
            start = time()

            logger.info('Indexing {0} documents...'.format(index_buffer_count))
            num_inserted, errors = bulk(es_client, index_buffer)

            if errors:
                for error in errors:
                    logger.error('Indexing error: {0}'.format(error))

            time_taken = time() - start
            logger.info('Indexed {0} documents in {1}s'.format(num_inserted, time_taken))

            # Reset the buffer
            index_buffer = []

        # Get any new document
        (host, port), stats = index_queue.get()

        server_hash = hash_address((host, port))
        date_time = datetime.utcnow().replace(microsecond=0)

        ping = stats['ping']
        info = stats['info']
        players = stats['players']

        # These are always logged
        history_stats = {
            'datetime': date_time,
            'server_hash': server_hash,
            'ping': ping,
            'game_id': info['app_id'],
            'gamemode': info['game'],
            'map': info['map'],
            'player_count': players['player_count'],
            'players': [
                {
                    'name': player['name'],
                    'score': player['score']
                }
                for player in players['players']
                if player['name']
            ]
        }

        # This will overwrite the current server index document
        current_stats = history_stats.copy()
        current_stats.update({
            'host': host,
            'port': port,
            'name': info['server_name'],
            'platform': str(info['platform']),
            'server_type': str(info['server_type']),
            'max_players': info['max_players']
        })

        index_buffer.append({
            '_index': settings.ES_INDEX,
            '_type': 'server',
            '_id': server_hash,
            '_source': current_stats
        })

        index_buffer.append({
            '_index': settings.ES_INDEX,
            '_type': 'history',
            '_source': history_stats
        })
