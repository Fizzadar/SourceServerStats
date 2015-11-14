# Source Server Stats
# File: sourcestats/util/elastic.py
# Desc: elasticsearch utilities

from datetime import datetime, timedelta

from flask import request, g
from elasticsearch import Elasticsearch
from elasticquery import ElasticQuery, Aggregate, Filter

from sourcestats import settings

from .request import in_request_args

ES_CLIENT = None
DEFAULT_INTERVAL = settings.COLLECT_INTERVAL / 60
SINCE_INTERVALS = {
    'd': 'days',
    'h': 'hours'
}


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


def _get_since():
    if hasattr(g, 'request_since'):
        return g.request_since

    since = None

    # Attempt to parse any since
    if in_request_args('since'):
        interval = request.args['since'][-1]

        if interval in SINCE_INTERVALS:
            try:
                value = int(request.args['since'][0:-1])
                since = datetime.utcnow() - timedelta(**{
                    SINCE_INTERVALS[interval]: value
                })
            except ValueError:
                pass

    # Default to a day
    if since is None:
        since = datetime.utcnow() - timedelta(days=1)

    # ES mapping format has no microsecond
    since = since.replace(microsecond=0)

    # Cache for current request & return
    g.request_since = since
    return since


def _past_time(**kwargs):
    return (datetime.utcnow() - timedelta(**kwargs)).replace(microsecond=0)

def get_request_interval():
    since = _get_since()

    # If we're under a day, every 5 mins, like the collector
    if since >= _past_time(days=1):
        return DEFAULT_INTERVAL

    # If we're under one week, every 30m
    elif since >= _past_time(days=7):
        return 30

    # If we're under one month, every 2 hours
    elif since >= _past_time(days=31):
        return 120

    # Default a day
    return 1440


def get_request_filters():
    filters = []

    since = _get_since()
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
    fields, filters=None,
    interval=DEFAULT_INTERVAL, aggregate_func=Aggregate.avg, sum_divide=False
):
    fields = [fields] if isinstance(fields, basestring) else fields

    q = get_es_query(index=settings.HISTORY_INDEXES)
    q.size(0)

    if filters:
        q.filter(Filter.and_(*filters))

    aggregates = []

    for field in fields:
        aggregates.append(aggregate_func(field, field))

    # Put the aggregates inside a date_histogram
    q.aggregate(
        Aggregate.date_histogram(
            'times', 'datetime', '{0}m'.format(interval)
        ).aggregate(*aggregates)
    )

    results = q.get()

    # Data is collected a 5min intervals, when we're summing we must divide by that interval
    interval_multipliter = 1
    if sum_divide:
        interval_multipliter = interval / 5

    date_histogram = []
    for bucket in results['aggregations']['times']['buckets']:
        date_bucket = {
            'datetime': bucket['key_as_string']
        }

        for field in fields:
            date_bucket[field] = int(round(
                bucket[field]['value'] / interval_multipliter
            ))

        date_histogram.append(date_bucket)

    return date_histogram
