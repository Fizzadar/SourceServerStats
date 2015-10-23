# Source Server Stats
# File: sourcestats/views/api/servers.py
# Desc: server API views

from datetime import datetime

from flask import request, jsonify
from elasticquery import Filter, Query, Aggregate
from elasticsearch.exceptions import NotFoundError

from ... import settings
from ...app import app
from ...util import api_abort, get_source_apps
from ...util.elastic import (
    get_es_query, get_es_client, get_request_filters,
    get_es_history, get_es_terms
)


@app.route('/api/v1/servers')
def get_servers():
    '''Lists & filters current server documents.'''
    q = get_es_query()

    filters = get_request_filters()
    queries = []

    # Always aggregate number of players
    q.aggregate(Aggregate.sum('player_count', 'player_count'))

    # Pagination
    q.size(request.args.get('size', 50))
    q.from_(request.args.get('from', 0))

    # Manual sorting
    if 'sort_field' in request.args:
        q.sort(
            request.args['sort_field'],
            order=request.args.get('sort_order', 'desc')
        )

    # Default sort
    else:
        queries.append(Query.function_score([{
            # Decay the score based on recency pinged (*0.5 after 1h)
            'linear': {
                'datetime': {
                    'origin': datetime.utcnow().replace(microsecond=0),
                    'scale': '1h',
                    'decay': 0.5,
                    'offset': '15m'
                }
            }
        }, {
            # Base on the player count
            'field_value_factor': {
                'field': 'player_count',
                'factor': 0.5,
                'missing': 0
            }
        }], score_mode='multiply', boost_mode='replace'))

    # Manual query
    if 'query' in request.args:
        query = request.args['query']

        # Make query partial-match when over 3 chars
        if len(query) >= 3:
            if not query.endswith('*'):
                query = '{0}*'.format(query)

        queries.append(Query.simple_query_string(query))

    if queries:
        q.query(Query.bool(must=queries))

    if filters:
        q.filter(Filter.and_(*filters))

    results = q.get()
    servers = []

    # Attach game names from ID's
    apps = get_source_apps()
    for server in results['hits']['hits']:
        server = server['_source']
        server['game'] = apps.get(server['game_id'], 'Unknown')
        servers.append(server)

    return jsonify(
        total=results['hits']['total'],
        players=results['aggregations']['player_count']['value'],
        servers=servers
    )


@app.route('/api/v1/server/<server_hash>')
def get_server(server_hash):
    '''Returns the current state of a server.'''
    try:
        server = get_es_client().get(
            index=settings.SERVERS_INDEX,
            doc_type='server',
            id=server_hash
        )
    except NotFoundError:
        api_abort(404, 'Server not found')

    server = server['_source']

    # Attach game name
    apps = get_source_apps()
    server['game'] = apps.get(server['game_id'], 'Unknown')

    return jsonify(server)


@app.route('/api/v1/server/<server_hash>/history/players')
def get_server_history_players(server_hash):
    filters = get_request_filters()
    filters.append(Filter.term('server_hash', server_hash))

    date_histogram = get_es_history('player_count', filters)

    return jsonify(players=date_histogram)


@app.route('/api/v1/server/<server_hash>/history/pings')
def get_server_history_ping(server_hash):
    filters = get_request_filters()
    filters.append(Filter.term('server_hash', server_hash))

    date_histogram = get_es_history('ping', filters)

    return jsonify(pings=date_histogram)


@app.route('/api/v1/server/<server_hash>/top/maps')
def get_server_top_maps(server_hash):
    '''Returns a list of the top maps we've seen on this server.'''
    filters = get_request_filters()
    filters.append(Filter.term('server_hash', server_hash))

    maps, total = get_es_terms(
        'map',
        filters=filters,
        index=settings.HISTORY_INDEXES,
        size=request.args.get('size')
    )

    return jsonify(maps=maps, total=total)


@app.route('/api/v1/server/<server_hash>/top/players')
def get_server_top_players(server_hash):
    '''Returns the most seen players on this server.'''
    filters = get_request_filters()
    filters.append(Filter.term('server_hash', server_hash))

    players, total = get_es_terms(
        'players.name',
        filters=filters,
        index=settings.HISTORY_INDEXES,
        size=request.args.get('size')
    )

    return jsonify(players=players, total=total)
