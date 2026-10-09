#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/e2e-local.sh [--no-cleanup] [--use-existing]
#
#   --no-cleanup     Skip stopping the container before and after the run.
#   --use-existing   Skip container setup entirely (start, wait, configure).
#                    Assumes a Nextcloud container is already running.
#                    Implies --no-cleanup.

CLEANUP=true
USE_EXISTING=false
for arg in "$@"; do
    case $arg in
        --no-cleanup)   CLEANUP=false ;;
        --use-existing) USE_EXISTING=true; CLEANUP=false ;;
    esac
done

BINDIR=$(dirname "$0")
. "$BINDIR/lib/env.sh"

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
"$BINDIR/run-playwright.sh" "$NC_VERSION"
