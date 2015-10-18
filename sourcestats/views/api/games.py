# Source Server Stats
# File: sourcestats/views/api/games.py
# Desc: game API views

from flask import jsonify
from elasticquery import Filter

from ...app import app
from ...util import get_source_apps
from ...util.elastic import get_es_history, get_es_terms, get_request_filters


@app.route('/api/v1/games')
def get_games():
    '''List current games and the number of servers playing on them.'''
    games, total = get_es_terms(
        'game_id',
        filters=get_request_filters()
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


@app.route('/api/v1/game/<int:game_id>/history/players')
def get_game_history(game_id):
    '''Returns a date histogram of players on this game.'''
    filters = get_request_filters()
    filters.append(Filter.term('game_id', game_id))

    date_histogram = get_es_history(
        filters=filters,
        include_players=True
    )

    return jsonify(players=date_histogram)
