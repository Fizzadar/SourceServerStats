# Source Server Stats
# File: sourcestats/util/__init__.py
# Desc: general utilities

from hashlib import sha1

import requests
from flask import jsonify, abort

#SOURCE_APPS = None
SOURCE_APPS = {
    240: 'Counter Strike: Source',
    440: 'Team Fortress 2',
    730: 'Counter Strike: Global Offensive',
    4000: "Garry's Mod"
}


def get_source_apps():
    global SOURCE_APPS

    if SOURCE_APPS is None:
        response = requests.get('http://api.steampowered.com/ISteamApps/GetAppList/v2').json()
        SOURCE_APPS = {
            app['appid']: app['name']
            for app in response['applist']['apps']
        }

    return SOURCE_APPS


def hash_address(address):
    host, port = address

    hasher = sha1()
    hasher.update(host)
    hasher.update(str(port))

    return hasher.hexdigest()


def api_abort(status_code, message):
    response = jsonify(error=message, status=status_code)
    response.status_code = status_code
    abort(response)
