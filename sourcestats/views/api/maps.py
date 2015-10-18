# Source Server Stats
# File: sourcestats/views/api/maps.py
# Desc: map API views

from flask import jsonify, request
from elasticquery import Filter

from ... import settings
from ...app import app
from ...util import get_source_apps
from ...util.elastic import get_es_history, get_es_terms, get_request_filters


@app.route('/api/v1/maps')
def get_maps():
    '''List current maps and the number of servers playing on them.'''
    maps, total = get_es_terms(
        'map',
        request.args.get('size', settings.ES_TERMS),
        filters=get_request_filters()
    )

    return jsonify(maps=maps, total=total)


@app.route('/api/v1/map/<name>')
def get_map(name):
    '''Gets details about a single map.'''
    filters = get_request_filters()
    filters.append(Filter.term('map', name))

    # Get games/server counts currently playing this map
    games, _ = get_es_terms(
        'game_id',
        filters=filters
    )

    # Attach game names
    apps = get_source_apps()
    games = [
        ((game[0], apps.get(game[0], 'Unknown')), game[1])
        for game in games
    ]

    return jsonify(name=name, games=games)


@app.route('/api/v1/map/<name>/history/players')
def get_map_player_history(name):
    '''Returns a date histogram of players on this map.'''
    filters = get_request_filters()
    filters.append(Filter.term('map', name))

    date_histogram = get_es_history(
        filters=filters,
        include_players=True
    )
    return jsonify(players=date_histogram)
