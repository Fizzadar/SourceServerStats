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
    gevent.spawn(find)
    gevent.spawn(collect)
    gevent.spawn(index)

    try:
        gevent.wait()
    except KeyboardInterrupt:
        print 'Exiting upon user request...'
        raise SystemExit(0)
