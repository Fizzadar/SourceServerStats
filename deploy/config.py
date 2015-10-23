# Source Server Stats
# File: deploy/config.py
# Desc: pyinfra deploy config, pre-builds client assets

from pyinfra import local, logger

TIMEOUT = 10


def before_deploy(data, state):
    # Ensure we're on the right branch so as to not build the wrong webpack
    branch = local.shell('git rev-parse --abbrev-ref HEAD')
    if branch != data.sourcestats_branch:
        raise SystemExit('Wrong branch detected: on {0}, want {1}'.format(
            branch.strip(), data.sourcestats_branch
        ))

    # Build webpack locally (grunt dev when dev mode)
    logger.info('Building webpack...')
    if data.env != 'dev':
        local.shell('''
            rm -rf sourcestats/static/dist/ && \
            grunt build
        ''')
