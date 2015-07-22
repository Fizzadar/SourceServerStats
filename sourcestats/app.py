from flask import Flask
from flask.ext.script import Manager

from . import settings


# Setup Flask app
app = Flask('sourcestats')
app.debug = settings.DEBUG

# Setup manager
manager = Manager(app)
