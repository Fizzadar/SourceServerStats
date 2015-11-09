# Source Server Stats
# File: sourcestats/settings.py
# Desc: settings for the Flask server

import os

ENV = os.environ.get('ENV', 'dev')
DEBUG = ENV == 'dev'

# Number of servers to collect from in parallel
PARALLEL = 200

# Loop intervals
COLLECT_INTERVAL = 300
FIND_INTERVAL = 300

# Timeout for reading addresses via UDP from Valve
MASTER_TIMEOUT = 30
# Timeout for reading status from gameservers
SERVER_TIMEOUT = 2

# Batch size for indexing documents in ES
ES_BATCH = 5000
# Default number of terms to aggregate in ES (/players)
ES_TERMS = 50
ES_INDEX = 'sourcestats'
ES_HOSTS = ['localhost:9200']

# The servers ES index (alias to versioned)
SERVERS_INDEX = 'sourcestats_servers'
# The history ES alias which is assigned to match the below
HISTORY_INDEXES = 'sourcestats_history'
# Date format for ES indexes
INDEX_DATE_FORMAT = '%Y%m%d'

REDIS_HOST = 'localhost'
REDIS_PORT = 6379
REDIS_ADDRESS_SET = 'sourcestats-addresses'

#VALVE_HOSTS = ['hl2master.steampowered.com']
VALVE_HOSTS = [
    '208.64.200.52',
    '208.64.200.65',
    '208.64.200.39'
]

# See: https://python-valve.readthedocs.org/en/latest/master_server.html#valve.source.master_server.MasterServerQuerier.find
VALVE_REGIONS = [
    u'na',
    u'sa',
    u'eu',
    u'as',
    u'oc',
    u'af',
    u'rest'
]


# Env specific settings
if ENV == 'production':
    PARALLEL = 6000
    ES_HOSTS = ['localhost:9200']
