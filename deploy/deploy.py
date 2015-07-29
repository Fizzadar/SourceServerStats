# Source Server Stats
# File: deploy/deploy.py
# Desc: pyinfra deploy script, targets Ubuntu

from pyinfra.modules import server, files, apt, pip, init, git


# Install system packages
apt.packages(
    [
        'wget', 'git', 'curl',
        'python-pip', 'python-dev',
        'openjdk-7-jre-headless', 'nginx', 'supervisor'
    ],
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
for directory in ['/opt/sourcestats', '/opt/env/sourcestats']:
    files.directory(
        directory,
        user='sourcestats',
        sudo=True
    )

# Clone the app
git.repo(
    'https://github.com/Fizzadar/SourceServerStats',
    '/opt/sourcestats',
    branch='develop',
    pull=True,
    sudo=True,
    sudo_user='sourcestats'
)

# Create a virtualenv
server.shell(
    'virtualenv /opt/env/sourcestats',
    sudo=True,
    sudo_user='sourcestats'
)

# Install the requirements
pip.packages(
    requirements='/opt/sourcestats/requirements.pip',
    venv='/opt/env/sourcestats',
    sudo=True,
    sudo_user='sourcestats'
)

# Build webpack locally
server.shell(
    'grunt build',
    local=True
)

# Sync static/dist directories
files.sync(
    '../sourcestats/static/dist',
    '/opt/sourcestats/static/dist',
    delete=True,
    sudo=True,
    sudo_user='sourcestats'
)

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

# Remove default Nginx config
server.shell(
    'rm -f /etc/nginx/sites-enabled/default',
    sudo=True
)
# ...and upload Nginx config
files.put(
    'files/sourcestats.nginx.conf',
    '/etc/nginx/sites-enabled/sourcestats',
    sudo=True
)

# Start Elasticsearch/supervisord
for service in ['elasticsearch', 'supervisord']:
    init.d(
        service,
        running=False,
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

# Update/restart supervisor tasks
server.shell(
    'supervisorctl update',
    'supervisorctl restart all',
    sudo=True
)
