#!/usr/bin/env python

from sourcestats.app import manager


if __name__ == '__main__':
    import boot # noqa
    manager.run()
