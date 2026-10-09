#!/bin/sh

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/test-envs.sh start | stop

if test "$1" = ""; then
    echo "Usage: $0 start | stop"
    exit 1
fi

start() {
    for i in 35 34 33; do
        nc-start.sh "$i" || echo "WARNING: could not start NC${i}, skipping"
        nc-enable-app.sh "$i" || echo "WARNING: could not enable app on NC${i}"
    done
}

stop() {
    nc-stop.sh all
}

case $1 in
    start) start ;;
    stop)  stop  ;;
    *) echo "Usage: $0 start | stop"; exit 1 ;;
esac
