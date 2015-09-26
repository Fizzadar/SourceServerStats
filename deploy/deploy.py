# Source Server Stats
# File: deploy/deploy.py
# Desc: pyinfra deploy script, targets Ubuntu

from pyinfra import host
from pyinfra.modules import server, files, apt, pip, init, git, local


# Install system packages
apt.packages(
    [
        'wget', 'git', 'curl',
        'python-pip', 'python-dev',
        'openjdk-7-jre-headless', 'nginx', 'supervisor'
    ],
    update=True,
    update_time=3600,
    sudo=True
)

# and global pip packages
pip.packages(
    ['virtualenv'],
    sudo=True
)

# and Elasticsearch
server.shell(
    'wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.6.0.deb',
    'dpkg -i elasticsearch-1.6.0.deb',
    '/usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head || true',
    sudo=True
)

# Setup user
server.user(
    'sourcestats',
    home='/home/sourcestats',
    shell='/bin/bash',
    sudo=True
)

# Create app & env dir
for directory in [host.data.app_dir, host.data.env_dir]:
    files.directory(
        directory,
        user='sourcestats',
        sudo=True
    )

# Create a virtualenv
if not host.file('{0}/bin/activate'.format(host.data.env_dir)):
    server.shell(
        'virtualenv {0}'.format(host.data.env_dir),
        sudo=True,
        sudo_user='sourcestats'
    )

# This is all covered by the synced Vagrant folder
if host.data.env != 'dev':
    # Clone the app
    git.repo(
        'https://github.com/Fizzadar/SourceServerStats',
        host.data.app_dir,
        branch='develop',
        pull=True,
        sudo=True,
        sudo_user='sourcestats'
    )

    # Build webpack locally
    local.shell(
        'grunt build',
        run_once=True
    )

    # Sync static/dist directories
    files.sync(
        '../sourcestats/static/dist',
        '{0}/sourcestats/static/dist'.format(host.data.app_dir),
        user='sourcestats',
        group='sourcestats',
        delete=True,
        sudo=True
    )

# Install the requirements
pip.packages(
    requirements='{0}/requirements.pip'.format(host.data.app_dir),
    venv=host.data.env_dir,
    sudo=True,
    sudo_user='sourcestats'
)

# Remove default Nginx config
server.shell(
    'rm -f /etc/nginx/sites-enabled/default',
    sudo=True
)
# ...and upload Nginx config
files.template(
    'templates/sourcestats.nginx.conf.jn2',
    '/etc/nginx/sites-enabled/sourcestats',
    sudo=True,
    is_dev=host.data.env == 'dev'
)

# Start Elasticsearch/supervisord
for service in ['elasticsearch', 'supervisor']:
    init.d(
        service,
        running=True,
        sudo=True
    )
# ...wait for ES to come online
server.wait(
    port=9200
)

# Reload nginx
init.d(
    'nginx',
    reloaded=True,
    sudo=True
)

# Create index & push any mappings changes
es_prefix = 'localhost:9200/sourcestats'
server.shell(
    'curl -X POST {0}'.format(es_prefix),
    'curl -X PUT {0}/server/_mapping -d@/opt/sourcestats/mappings/server.json'.format(es_prefix),
    'curl -X PUT {0}/history/_mapping -d@/opt/sourcestats/mappings/history.json'.format(es_prefix)
)


# No supervisor tasks in dev
if host.data.env != 'dev':
    # Upload collector supervisor config
    files.put(
        'files/api.supervisor.conf',
        '/etc/supervisor/conf.d/api.conf',
        sudo=True
    )

    # Upload API supervisor config
    files.put(
        'files/collector.supervisor.conf',
        '/etc/supervisor/conf.d/collector.conf',
        sudo=True
    )

    # Update/restart supervisor tasks
    server.shell(
        'supervisorctl update',
        'supervisorctl restart all',
        sudo=True
    )
