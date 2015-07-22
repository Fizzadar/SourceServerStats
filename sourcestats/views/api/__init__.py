# Source Server Stats
# File: sourcestats/views/api/__init__.py
# Desc: base API views

from flask import request, jsonify

from ... import settings
from ...app import app
from ...util.elastic import get_es_terms, get_request_filters, get_es_history


@app.route('/api')
def api_index():
    '''Lists all the API endpoints.'''
    endpoints = [
        url.rule
        for url in app.url_map.iter_rules()
        if url.rule.startswith('/api') and url.rule != '/api'
    ]

    return jsonify(endpoints=endpoints)


@app.route('/api/v1/gamemodes')
def get_gamemodes():
    '''List current gamemodes and the number of servers running them.'''
    terms, total = get_es_terms(
        'gamemode',
        request.args.get('size', settings.ES_TERMS),
        filters=get_request_filters()
    )

    return jsonify(gamesmodes=terms, total=total)


@app.route('/api/v1/history')
def get_history():
    '''Returns a global date histogram of (ping, players) from the history docs.'''
    date_histogram = get_es_history(include_servers=True)
    return jsonify(history=date_histogram)
