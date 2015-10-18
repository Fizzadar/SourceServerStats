# Source Server Stats
# File: sourcestats/views/__init__.py
# Desc: the index capture view!

from os import path
from glob import glob

from flask import render_template

from ..app import app

_js_file = None


@app.route('/<path:_>')
@app.route('/', defaults={'_': ''})
def index(_):
    global _js_file

    if _js_file is None:
        js_dir = path.join(app.root_path, 'static', 'dist')
        print js_dir
        # Find all .js files in dist, get first (should only be one) and strip the path
        js_file = glob(path.join(js_dir, '*.js'))[0]
        # Assign to the global
        _js_file = path.basename(js_file)

    return render_template('index.html', js_file=_js_file)
