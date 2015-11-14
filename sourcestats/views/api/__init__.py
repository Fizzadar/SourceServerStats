# Source Server Stats
# File: sourcestats/views/api/__init__.py
# Desc: base API views

from flask import jsonify

from sourcestats.app import app
from sourcestats.util.elastic import get_es_terms, get_request_filters


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
        filters=get_request_filters()
    )

    return jsonify(gamesmodes=terms, total=total)
