# Source Server Stats
# File: sourcestats/collector/__main__.py
# Desc: __main__ for the collector

from gevent import monkey
monkey.patch_all()

import sys
import logging

import gevent
from coloredlogs import ColoredStreamHandler

from .. import logger
from . import find, collect, index


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

    logger.info('Starting find, collect & index workers...')

    greenlets = [
        gevent.spawn(find),
        gevent.spawn(collect),
        gevent.spawn(index)
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
