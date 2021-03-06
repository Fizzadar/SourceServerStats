# Source Server Stats
# File: sourcestats/views/api/games.py
# Desc: game API views

from flask import jsonify, request
from elasticquery import Filter, Aggregate

from sourcestats.app import app
from sourcestats.util import get_source_apps
from sourcestats.util.elastic import (
    get_es_history, get_es_terms,
    get_request_filters, get_request_interval
)


@app.route('/api/v1/games')
def get_games():
    '''List current games and the number of servers playing on them.'''

    games, total = get_es_terms(
        'game_id',
        filters=get_request_filters(),
        size=request.args.get('size')
    )

    # Attach names
    apps = get_source_apps()
    games = [
        ((game[0], apps.get(game[0], 'Unknown')), game[1])
        for game in games
    ]

    return jsonify(games=games, total=total)


@app.route('/api/v1/game/<int:game_id>')
def get_game(game_id):
    '''Gets details about a single game.'''

    apps = get_source_apps()
    name = apps.get(game_id, 'Unknown')

    return jsonify(name=name, id=game_id)


@app.route('/api/v1/game/<int:game_id>/maps')
def get_game_maps(game_id):
    '''Returns a list of the maps currently being played with this game.'''

    filters = get_request_filters()
    filters.append(Filter.term('game_id', game_id))

    maps, total = get_es_terms(
        'map',
        filters=filters,
        size=request.args.get('size')
    )

    return jsonify(maps=maps, total=total)


@app.route('/api/v1/game/<int:game_id>/history/players')
def get_game_history(game_id):
    '''Returns a date histogram of players on this game.'''

    filters = get_request_filters()
    filters.append(Filter.term('game_id', game_id))

    date_histogram = get_es_history(
        'player_count', filters,
        interval=get_request_interval(),
        aggregate_func=Aggregate.sum,
        sum_divide=True
    )

    return jsonify(players=date_histogram)
