# Source Server Stats
# File: boot.py
# Desc: bootstrap/import the API

from sourcestats.app import app # noqa
from sourcestats.views.api import servers, maps, games # noqa
