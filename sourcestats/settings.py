# Source Server Stats
# File: sourcestats/settings.py
# Desc: settings for the Flask server

DEBUG = True

# Number of servers to collect from in parallel
PARALLEL = 4000

# Loop intervals (+time to execute!)
COLLECT_INTERVAL = 30
FIND_INTERVAL = 300

# Timeout for reading addresses via UDP from Valve
MASTER_TIMEOUT = 30
# Timeout for reading status from gameservers
SERVER_TIMEOUT = 30
# Number of times a server fails before blacklisting
FAIL_COUNT = 5

# Batch size for indexing documents in ES
ES_BATCH = 1000
# Default number of terms to aggregate in ES (/players)
ES_TERMS = 1000
ES_INDEX = 'sourcestats'
ES_HOSTS = ['localhost:9200']

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
