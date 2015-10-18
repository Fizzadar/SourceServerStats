# Source Server Stats
# File: sourcestats/scripts/indexes.py
# Desc: CLI commands for managing ES indexes

import json
from datetime import datetime

from elasticsearch.exceptions import NotFoundError

from sourcestats import settings
from sourcestats.app import manager
from sourcestats.util.elastic import get_es_client


@manager.command
def setup_index():
    '''Creates/updates and aliases the servers index.'''
    print '### Preparing indexes'

    mappings_data = open('mappings/server.json', 'r').read()
    mappings = json.loads(mappings_data)

    es_client = get_es_client()

    try:
        es_client.indices.get(settings.SERVERS_INDEX)
    except NotFoundError:
        today = datetime.now()
        index_name = '{0}_{1}'.format(
            settings.SERVERS_INDEX,
            today.strftime(settings.INDEX_DATE_FORMAT)
        )

        # Create the index
        get_es_client().indices.create(index=index_name)
        print '--> Added index: {0}'.format(index_name)

        # Set the alias
        get_es_client().indices.put_alias(
            index=index_name,
            name=settings.SERVERS_INDEX
        )

    # Set/update the mappings
    es_client.indices.put_mapping(
        index=settings.SERVERS_INDEX,
        doc_type='server', body=mappings
    )
    print '--> Put mapping -> {0}/server'.format(settings.SERVERS_INDEX)
