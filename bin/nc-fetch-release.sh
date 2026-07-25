#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/nc-fetch-release.sh <nc_major_version>
# Prints the latest stable release tag for the given Nextcloud major version.
# Results are cached per day.

NC_MAJOR="${1:?Usage: $0 <nc_major_version>}"

TODAY=$(date "+%Y-%m-%d")
CACHE=$HOME/.cache/nextcloud-dev/$TODAY
mkdir -p "$CACHE"

ALL_RELEASES=$CACHE/all_releases.json
if test ! -e "$ALL_RELEASES"; then
    echo "Fetching Nextcloud releases..." >&2
    gh api '/repos/nextcloud/server/releases?per_page=300' >"$ALL_RELEASES"
fi

RELEASE=$(jq -r '.[] | .tag_name' "$ALL_RELEASES" \
    | grep -v rc | grep -v beta \
    | grep "^v${NC_MAJOR}\." \
    | sort -V -r \
    | head -1)

if test -z "$RELEASE"; then
    echo "ERROR: could not find a release for Nextcloud ${NC_MAJOR}" >&2
    exit 1
fi

echo "$RELEASE"
