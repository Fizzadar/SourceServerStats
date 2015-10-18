# Source Server Stats
# File: sourcestats/util/elastic.py
# Desc: elasticsearch utilities

from datetime import datetime, timedelta

from flask import request
from elasticsearch import Elasticsearch
from elasticquery import ElasticQuery, Aggregate, Filter
from dateutil.parser import parse as parse_date

from .. import settings
from .request import in_request_args

ES_CLIENT = None


def get_es_client():
    global ES_CLIENT

    if ES_CLIENT is None:
        ES_CLIENT = Elasticsearch(settings.ES_HOSTS)

    return ES_CLIENT


def get_es_query(index=settings.SERVERS_INDEX):
    return ElasticQuery(
        es=get_es_client(),
        index=index,
        doc_type='server'
    )


def get_request_filters():
    filters = []

    since = None

    # Attempt to parse any since
    if in_request_args('since'):
        try:
            since = parse_date(request.args['since'])
        except ValueError:
            pass

    # Default to a day
    if since is None:
        since = datetime.utcnow() - timedelta(days=1)

    # ES mapping format has no microsecond
    since = since.replace(microsecond=0)
    filters.append(Filter.range('datetime', gte=since))

    for field in [
        'game_id',
        'map'
    ]:
        if in_request_args(field):
            filters.append(Filter.term(field, request.args[field]))

    return filters


def get_es_terms(field_name, filters=None, size=None, index=settings.SERVERS_INDEX):
    '''List 'objects', ie distinct field values from the indexes.'''
    q = get_es_query(index=index)
    q.size(0)

    if size is None:
        size = settings.ES_TERMS

    if filters:
        q.filter(Filter.and_(*filters))

    # Aggregates to generate terms and distinct values
    aggregates = (
        Aggregate.terms('objects', field_name, size=size),
        Aggregate.cardinality('values', field_name, precision_threshold=10000)
    )

    nested = False

    # Nested aggregate
    if '.' in field_name:
        nested_field, field_name = field_name.split('.')
        nested_aggregate = Aggregate.nested('nested', nested_field).aggregate(*aggregates)
        q.aggregate(nested_aggregate)
        nested = True

    # Normal aggregate
    else:
        q.aggregate(*aggregates)

    results = q.get()
    aggregations = results['aggregations']

    if nested:
        results_object = aggregations['nested']['objects']['buckets']
        total = aggregations['nested']['values']['value']
    else:
        results_object = aggregations['objects']['buckets']
        total = aggregations['values']['value']

    # For history docs the doc_counts in terms are useless as they'll just be duplicates
    if index == settings.HISTORY_INDEXES:
        objects = [bucket['key'] for bucket in results_object]

    # But in servers they represent what we see live
    else:
        objects = [
            (bucket['key'], bucket['doc_count'])
            for bucket in results_object
        ]

    return objects, total


def get_es_history(
    interval='15m', filters=None,
    include_ping=False, include_servers=False, include_players=False
):
    q = get_es_query(index=settings.HISTORY_INDEXES)
    q.size(0)

    if filters:
        q.filter(Filter.and_(*filters))

    aggregates = []

    # Because stats aren't collected on a fixed interval, we can't sum the player_count
    # field as it will result in duplicates. So here we do a cardinality aggregate
    # on the player names to get an accurate # of players per interval.
    if include_players:
        aggregates.append(Aggregate.nested('players', 'players').aggregate(
            Aggregate.cardinality('player_count', 'players.name')
        ))

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
            'datetime': bucket['key_as_string']
        }

        if include_players:
            date_bucket['players'] = bucket['players']['player_count']['value']

        if include_ping:
            date_bucket['ping'] = bucket['ping']['value']

        if include_servers:
            date_bucket['servers'] = bucket['servers']['value']

        date_histogram.append(date_bucket)

    return date_histogram
