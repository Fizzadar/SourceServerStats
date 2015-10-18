# Source Server Stats
# File: sourcestats/util/request.py
# Desc: request utilities

from flask import request


def in_request_args(field):
    return field in request.args and request.args[field]
