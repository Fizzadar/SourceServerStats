# Source Server Stats
# File: sourcestats/views/api/history.py
# Desc: global history views

from flask import jsonify
from elasticquery import Aggregate

from ...app import app
from ...util.elastic import get_es_history, get_request_filters


@app.route('/api/v1/history/servers')
def get_server_history():
    '''Returns a date histogram of server count across everything.'''
    date_histogram = get_es_history(
        'server_hash', get_request_filters(),
        aggregate_func=Aggregate.cardinality
    )

    return jsonify(servers=date_histogram)


@app.route('/api/v1/history/players')
def get_player_history():
    '''Returns a date histogram of player count across everything.'''
    date_histogram = get_es_history(
        'player_count', get_request_filters(),
        aggregate_func=Aggregate.sum
    )

    return jsonify(players=date_histogram)
