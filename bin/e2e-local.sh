#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/e2e-local.sh [--no-cleanup] [--use-existing] [--by-name] [-h|--help]
#
#   --no-cleanup     Skip stopping the container before and after the run.
#   --use-existing   Skip container setup entirely (start, wait, configure).
#                    Assumes a Nextcloud container is already running.
#                    Implies --no-cleanup.
#   --by-name        Reach the container as http://nextcloud-XX (port 80) on the
#                    `nextcloud` docker network instead of http://<host ip>:80XX.
#   -h, --help       Show this help and exit.

usage() {
    # Print the "# Usage:" comment block above, without the leading "# "
    sed -n '/^# Usage:/,/^[^#]/{/^#/s/^# \{0,1\}//p;}' "$0"
}

CLEANUP=true
USE_EXISTING=false
BY_NAME=""
for arg in "$@"; do
    case $arg in
        --no-cleanup)   CLEANUP=false ;;
        --use-existing) USE_EXISTING=true; CLEANUP=false ;;
        --by-name)      BY_NAME=--by-name ;;
        -h|--help)      usage; exit 0 ;;
        *)              echo "Unknown option: $arg" >&2; usage >&2; exit 1 ;;
    esac
done

BINDIR=$(dirname "$0")
. "$BINDIR/lib/env.sh"
if ! $USE_EXISTING; then
    . "$BINDIR/lib/require-nc-tools.sh"
fi

echo "Nextcloud version: $NC_VERSION"
echo "Host IP: $HOST_IP"

cleanup() {
    # shellcheck disable=SC2317
    if $CLEANUP; then
        nc-stop.sh "$NC_VERSION"
    fi
}
trap cleanup EXIT

"$BINDIR/build.sh"

if ! $USE_EXISTING; then
    if $CLEANUP; then
        nc-stop.sh "$NC_VERSION"
    fi
    nc-start.sh "$NC_VERSION"
    nc-enable-app.sh "$NC_VERSION"
fi

echo "Running Playwright tests against NC${NC_VERSION}..."
# shellcheck disable=SC2086
"$BINDIR/run-playwright.sh" $BY_NAME "$NC_VERSION"
