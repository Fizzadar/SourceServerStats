#!/usr/bin/env python
# flake8: noqa

from sourcestats.app import manager
from sourcestats.scripts import indexes


if __name__ == '__main__':
    import boot
    manager.run()
