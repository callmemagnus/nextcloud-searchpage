#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/run-playwright.sh [--by-name] [nc_major_version|--exclude <nc_major_version>]
# Runs Playwright tests in Docker against already-running Nextcloud containers.
#
#   --by-name   Reach containers as http://nextcloud-XX (port 80) on the 'nextcloud'
#               docker network, instead of http://<host ip>:80XX.

. "$(dirname "$0")/lib/env.sh"

PLAYWRIGHT_VERSION=$(jq -r '.devDependencies["@playwright/test"]' "$ROOT/package.json")
if test -z "$PLAYWRIGHT_VERSION" || test "$PLAYWRIGHT_VERSION" = "null"; then
    echo "ERROR: could not read @playwright/test version from package.json" >&2
    exit 1
fi

BY_NAME=false
if test "$1" = "--by-name"; then
    BY_NAME=true
    shift
fi

NC_VERSION_ARG=""
if test "$1" = "--exclude" && test -n "$2"; then
    NC_VERSION_ARG="-e EXCLUDE_NC_VERSION=$2"
elif test -n "$1"; then
    NC_VERSION_ARG="-e TARGET_NC_VERSION=$1"
fi

if $BY_NAME; then
    TARGET_ARGS="--network nextcloud -e TARGET_BY_NAME=1"
else
    TARGET_ARGS="-e TARGET_HOST=${HOST_IP}"
fi

echo "Playwright version: $PLAYWRIGHT_VERSION"

docker run \
    --rm \
    -w /app \
    $TARGET_ARGS \
    $NC_VERSION_ARG \
    -v "${ROOT}:/app" \
    "mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}" \
    npx playwright test
