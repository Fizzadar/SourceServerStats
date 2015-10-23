# Source Server Stats
# File: sourcestats/app.py
# Desc: the app

from flask import Flask
from flask.ext.script import Manager
from redis import StrictRedis

from . import settings


# Setup Flask app
app = Flask('sourcestats')
app.debug = settings.DEBUG

# Setup manager
manager = Manager(app)

# Redis
redis_client = StrictRedis(settings.REDIS_HOST, settings.REDIS_PORT)
