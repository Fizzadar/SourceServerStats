# Source Server Stats
# File: sourcestats/collector/cache.py
# Desc: simple state cache to avoid collecting too quickly when restarting

import json
from datetime import datetime

from sourcestats import logger


# Global state of the collector, mirrored to .sourcestats_cache in cwd
COLLECTOR_STATE = None


def _save_state():
    state = get_collector_state().copy()

    if 'last_start' in state:
        state['last_start'] = state['last_start'].isoformat()

    cache_data = json.dumps(state)
    try:
        cache_file = open('.sourcestats_cache', 'w')
        cache_file.write(cache_data)
        cache_file.close()

        logger.debug('Saved collector state: {0}'.format(COLLECTOR_STATE))

    # If we can't write then we can't cache, just log
    except IOError:
        logger.warning('Cannot create cache file: .sourcestats_cache')


def get_collector_state():
    global COLLECTOR_STATE

    if COLLECTOR_STATE is None:
        try:
            cache_file = open('.sourcestats_cache', 'r')
            cache_data = cache_file.read()
            cache_file.close()

            COLLECTOR_STATE = json.loads(cache_data)

            last_start = COLLECTOR_STATE.get('last_start')
            if last_start:
                COLLECTOR_STATE['last_start'] = datetime.strptime(last_start, '%Y-%m-%dT%H:%M:%S')

        except IOError:
            COLLECTOR_STATE = {}

    return COLLECTOR_STATE


def set_collector_state(running):
    state = get_collector_state()

    new_state = {
        'running': running
    }

    if running:
        new_state['last_start'] = datetime.now().replace(microsecond=0)

    state.update(new_state)
    _save_state()
