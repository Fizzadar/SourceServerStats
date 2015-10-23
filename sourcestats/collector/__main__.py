# Source Server Stats
# File: sourcestats/collector/__main__.py
# Desc: __main__ for the collector

from gevent import monkey
monkey.patch_all()

import sys
import logging
import time

import gevent
from coloredlogs import ColoredStreamHandler

from sourcestats import settings, logger

from . import find, collect, wait_for_collect, load_cached_addresses


def _run_loop(function, interval):
    '''
    Like setInterval, slight time drift as usual, useful in tasks as well as here, borrowed
    from github.com/Oxygem/pytask.
    '''
    while True:
        before = time.time()
        function()

        duration = time.time() - before
        if duration < interval:
            gevent.sleep(interval - duration)


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.CRITICAL)
    log_level = logging.DEBUG if '--debug' in sys.argv else logging.INFO

    color_args = {
        'show_timestamps': False,
        'show_hostname': False
    }
    handler = ColoredStreamHandler(level=log_level, **color_args)
    logger.setLevel(log_level)
    logger.addHandler(handler)

    n_addresses = load_cached_addresses()
    logger.info('Loaded {0} cached addresses'.format(n_addresses))

    logger.info('Starting find & collect workers...')

    # Waits for the previous instance had completed a collection run within COLLECT_INTERVAL
    wait_for_collect()

    greenlets = [
        gevent.spawn(lambda: _run_loop(find, settings.FIND_INTERVAL)),
        gevent.spawn(lambda: _run_loop(collect, settings.COLLECT_INTERVAL))
    ]

    try:
        while True:
            # Get greenlets which have stopped (should be empty list)
            greenlet_states = [greenlet.ready() for greenlet in greenlets]
            greenlet_states = filter(lambda x: x, greenlet_states)

            # If we have any, something broke!
            if len(greenlet_states) > 0:
                break

            gevent.sleep(1)

        logger.critical('One of the greenlets stopped, exiting!')
    except KeyboardInterrupt:
        print 'Exiting upon user request...'
        raise SystemExit(0)
