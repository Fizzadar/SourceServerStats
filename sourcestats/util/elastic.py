# Source Server Stats
# File: sourcestats/util/elastic.py
# Desc: elasticsearch utilities

from datetime import datetime, timedelta

from flask import request
from elasticsearch import Elasticsearch
from elasticquery import ElasticQuery, Aggregate, Filter

from .. import settings

ES_CLIENT = None


def get_es_client():
    global ES_CLIENT

    if ES_CLIENT is None:
        ES_CLIENT = Elasticsearch(settings.ES_HOSTS)

    return ES_CLIENT


def get_es_query(doc_type='server'):
    return ElasticQuery(
        es=get_es_client(),
        index=settings.ES_INDEX,
        doc_type=doc_type
    )


def get_request_filters():
    filters = []

    since = None

    # Prefer since arg, but ignore if invalid (not ISO format YYYY-MM-DD)
    if 'since' in request.args:
        try:
            since = datetime.strptime(request.args['since'], '%Y-%M-%D')
        except ValueError:
            pass

    # Default one day
    if since is None:
        since = (datetime.utcnow() - timedelta(days=1)).replace(microsecond=0)

    filters.append(Filter.range('datetime', gte=since))

    for field in [
        'game_id',
        'map'
    ]:
        if field in request.args:
            filters.append(Filter.term(field, request.args[field]))

    return filters


def get_es_terms(field_name, size=settings.ES_TERMS, filters=None, doc_type='server'):
    '''List 'objects', ie distinct field values from the indexes.'''
    q = get_es_query(doc_type=doc_type)
    q.size(0)

    if filters:
        q.filter(Filter.and_(*filters))

    q.aggregate(
        Aggregate.terms('objects', field_name, size=size),
        Aggregate.cardinality('values', field_name, precision_threshold=10000)
    )

    results = q.get()
    objects = [
        (bucket['key'], bucket['doc_count'])
        for bucket in results['aggregations']['objects']['buckets']
    ]

    total = results['aggregations']['values']['value']

    return objects, total


def get_es_history(
    interval='15m', since=None, filters=None,
    include_ping=False, include_servers=False
):
    q = get_es_query(doc_type='history')
    q.size(0)

    filters = filters or []

    # Default one day
    if since is None:
        since = (datetime.utcnow() - timedelta(days=1)).replace(microsecond=0)

    filters.append(Filter.range('datetime', gte=since))
    q.filter(Filter.and_(*filters))

    # Because stats aren't collected on a fixed interval, we can't sum the player_count
    # field as it will result in duplicates. So here we do a cardinality aggregate
    # on the player names to get an accurate # of players per interval.
    aggregates = [
        Aggregate.nested('players', 'players').aggregate(
            Aggregate.cardinality('player_count', 'players.name')
        )
    ]

    if include_ping:
        aggregates.append(Aggregate.avg('ping', 'ping'))

    if include_servers:
        aggregates.append(Aggregate.cardinality('servers', 'server_hash'))

    q.aggregate(
        Aggregate.date_histogram('times', 'datetime', interval).aggregate(*aggregates)
    )

    results = q.get()

    date_histogram = []
    for bucket in results['aggregations']['times']['buckets']:
        date_bucket = {
            'datetime': bucket['key_as_string'],
            'players': bucket['players']['player_count']['value']
        }

        if include_ping:
            date_bucket['ping'] = bucket['ping']['value']

        if include_servers:
            date_bucket['servers'] = bucket['servers']['value']

        date_histogram.append(date_bucket)

    return date_histogram
