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
from ...util.elastic import get_es_query, get_es_client, get_es_history, get_request_filters


@app.route('/api/v1/servers')
def get_servers():
    '''Lists & filters current server documents.'''
    q = get_es_query()

    filters = get_request_filters()
    queries = []

    # Always aggregate number of players
    q.aggregate(Aggregate.nested('players', 'players').aggregate(
        Aggregate.value_count('player_count', 'players.name')
    ))

    # Pagination
    q.size(request.args.get('size', 50))
    q.from_(request.args.get('from', 0))

    # Fields filter
    if 'fields' in request.args:
        q.fields(request.args['fields'].split(','))

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
        queries.append(Query.simple_query_string(request.args['query']))

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
        players=results['aggregations']['players']['player_count']['value'],
        servers=servers
    )


@app.route('/api/v1/server/<server_hash>')
def get_server(server_hash):
    '''Returns the current state of a server.'''
    try:
        server = get_es_client().get(
            index=settings.ES_INDEX,
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


@app.route('/api/v1/server/<server_hash>/history')
def get_server_history(server_hash):
    '''
    Returns a date histogram (ping, players) from the history docs for a specific
    server.
    '''
    date_histogram = get_es_history(
        filters=[Filter.term('server_hash', server_hash)],
        include_ping=True
    )
    return jsonify(history=date_histogram)


@app.route('/api/v1/server/<server_hash>/history/maps')
def get_server_maps(server_hash):
    '''Returns a list of all maps we've ever seen on this server.'''
    q = get_es_query(doc_type='history')
    q.size(0)
    q.filter(Filter.term('server_hash', server_hash))

    q.aggregate(
        Aggregate.terms('maps', 'map', size=100)
    )

    results = q.get()
    maps = [bucket['key'] for bucket in results['aggregations']['maps']['buckets']]

    return jsonify(maps=maps)


@app.route('/api/v1/server/<server_hash>/history/players')
def get_server_players(server_hash):
    '''Returns a list of all players we've ever seen on this server.'''
    q = get_es_query(doc_type='history')
    q.size(0)
    q.filter(Filter.term('server_hash', server_hash))

    q.aggregate(
        Aggregate.nested('players', 'players').aggregate(
            Aggregate.terms('player_names', 'players.name', size=100)
        )
    )

    results = q.get()
    players = [
        bucket['key']
        for bucket in results['aggregations']['players']['player_names']['buckets']
    ]

    return jsonify(players=players)
