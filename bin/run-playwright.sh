#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/run-playwright.sh [nc_major_version|--exclude <nc_major_version>]
# Runs Playwright tests in Docker against already-running Nextcloud containers.

. "$(dirname "$0")/lib/env.sh"

PLAYWRIGHT_VERSION=$(jq -r '.devDependencies["@playwright/test"]' "$ROOT/package.json")
if test -z "$PLAYWRIGHT_VERSION" || test "$PLAYWRIGHT_VERSION" = "null"; then
    echo "ERROR: could not read @playwright/test version from package.json" >&2
    exit 1
fi

NC_VERSION_ARG=""
if test "$1" = "--exclude" && test -n "$2"; then
    NC_VERSION_ARG="-e EXCLUDE_NC_VERSION=$2"
elif test -n "$1"; then
    NC_VERSION_ARG="-e TARGET_NC_VERSION=$1"
fi

echo "Playwright version: $PLAYWRIGHT_VERSION"

docker run \
    --rm \
    -w /app \
    -e "TARGET_HOST=${HOST_IP}" \
    $NC_VERSION_ARG \
    -v "${ROOT}:/app" \
    "mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}" \
    npx playwright test
