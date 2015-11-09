# Source Server Stats
# File: deploy/deploy.py
# Desc: pyinfra deploy script, targets Ubuntu

import os

from pyinfra import host, local, logger, hook
from pyinfra.modules import server, files, apt, pip, init, git

TIMEOUT = 10
SUDO = True


# Ensure we're on the right branch so as to not build the wrong webpack
@hook.before_connect
def check_branch(data, state):
    branch = local.shell('git rev-parse --abbrev-ref HEAD')
    if branch != data.sourcestats_branch:
        raise SystemExit('Wrong branch detected: on {0}, want {1}'.format(
            branch.strip(), data.sourcestats_branch
        ))

# Build webpack locally (grunt dev when dev mode)
@hook.before_facts
def build_webpack(data, state):
    if os.environ.get('SKIP_WEBPACK') != '1' and data.env != 'dev':
        logger.info('Building webpack...')
        local.shell('''
            rm -rf sourcestats/static/dist/ && \
            grunt build
        ''')


# Install system packages
apt.packages(
    [
        'wget', 'git', 'curl',
        'python-pip', 'python-dev',
        'openjdk-7-jre-headless', 'nginx', 'supervisor', 'redis-server'
    ],
    update=True, cache_time=3600
)

# and global pip packages
pip.packages(
    ['virtualenv']
)

# and Elasticsearch
server.shell(
    'wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-{0}.deb'.format(host.data.elasticsearch_version),
    'dpkg -i elasticsearch-{0}.deb'.format(host.data.elasticsearch_version),
    '/usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head || true'
)

# Setup user
server.user(
    'sourcestats',
    home='/home/sourcestats',
    shell='/bin/bash'
)

# Create app & env dir
for directory in [host.data.app_dir, host.data.env_dir]:
    files.directory(
        directory,
        user='sourcestats'
    )

# Create a virtualenv
if not host.file('{0}/bin/activate'.format(host.data.env_dir)):
    server.shell(
        'virtualenv {0}'.format(host.data.env_dir),
        sudo_user='sourcestats'
    )

# This is all covered by the synced Vagrant folder
if host.data.env != 'dev':
    # Clone the app
    git.repo(
        'https://github.com/Fizzadar/SourceServerStats',
        host.data.app_dir,
        branch=host.data.sourcestats_branch,
        pull=True,
        sudo_user='sourcestats'
    )

    # Sync static/dist directories
    files.sync(
        '../sourcestats/static/dist',
        '{0}/sourcestats/static/dist'.format(host.data.app_dir),
        user='sourcestats', group='sourcestats',
        delete=True
    )

# Install the requirements
pip.packages(
    requirements='{0}/requirements.pip'.format(host.data.app_dir),
    virtualenv=host.data.env_dir,
    sudo_user='sourcestats'
)

# Remove default Nginx config
server.shell(
    'rm -f /etc/nginx/sites-enabled/default'
)
# ...and upload Nginx config
files.template(
    'templates/sourcestats.nginx.conf.jn2',
    '/etc/nginx/sites-enabled/sourcestats'
)

# Start Elasticsearch
for service in ('elasticsearch', 'redis-server'):
    init.d(
        service,
        running=True
    )

# ...wait for ES to come online
server.wait(
    port=9200
)

# Reload nginx
init.d(
    'nginx',
    reloaded=True
)

# Create/setup servers index
server.shell(
    '''
    cd /opt/sourcestats && \
    ENV={0} /opt/env/sourcestats/bin/python manage.py setup_index
    '''.format(host.data.env),
    sudo_user='sourcestats'
)

# server.shell(
#     '/opt/env/sourcestats/bin/python manage.py setup_index',
#     env={'env': host.data.env}, chdir='/opt/sourcestats'
# )


# No supervisor tasks in dev
if host.data.env != 'dev':
    # Set security limits so sourcestats user can parallel 6k connections
    files.put(
        'files/limits.conf',
        '/etc/security/limits.conf'
    )

    # Upload collector supervisor config
    files.template(
        'templates/api.supervisor.conf.jn2',
        '/etc/supervisor/conf.d/api.conf'
    )

    # Upload API supervisor config
    files.template(
        'templates/collector.supervisor.conf.jn2',
        '/etc/supervisor/conf.d/collector.conf'
    )

    # Restart supervisor
    init.d(
        'supervisor',
        restarted=True
    )

# Dev additions
else:
    # Setup vagrant's .bash_profile for dev
    files.template(
        'templates/vagrant.bash_profile.jn2',
        '/home/vagrant/.bash_profile',
        user='vagrant', group='vagrant'
    )
