# Source Server Stats
# File: sourcestats/views/__init__.py
# Desc: the index capture view!

from flask import render_template

from ..app import app


@app.route('/', defaults={'_': ''})
@app.route('/servers', defaults={'_': 'servers'})
@app.route('/games', defaults={'_': 'games'})
@app.route('/maps', defaults={'_': 'maps'})
@app.route('/server/<_>')
@app.route('/game/<_>')
@app.route('/map/<_>')
def index(_):
    return render_template('index.html')
