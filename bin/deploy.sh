#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Usage: bin/deploy.sh <[user@]host:/path/to/nextcloud/apps>
# Replaces <apps>/thesearchpage with the runtime files of the app, over SSH (needs only ssh and tar).
# The new copy is unpacked next to the old one and swapped in, so a failed upload leaves the old one running.
# Set SSH to use another ssh command, with options if needed: SSH="/opt/bin/ssh -p 2222" bin/deploy.sh ...

SSH="${SSH:-ssh}"

TARGET="${1:?Usage: $0 <[user@]host:/path/to/nextcloud/apps>}"
HOST="${TARGET%%:*}"
APPS="${TARGET#*:}"
if test "$HOST" = "$TARGET" || test -z "$HOST" || test -z "$APPS"; then
    echo "ERROR: expected [user@]host:/path/to/nextcloud/apps, got: $TARGET" >&2
    exit 1
fi
case "$APPS" in
*\'*) echo "ERROR: the path must not contain a single quote" >&2; exit 1 ;;
esac
DEST="${APPS%/}/thesearchpage"

cd "$(dirname "$0")/.."
make build


tar -czf - appinfo img js l10n lib templates | $SSH "$HOST" "
    set -e
    test -d '${APPS%/}' || { echo 'ERROR: ${APPS%/} does not exist' >&2; exit 1; }
    rm -rf '$DEST.new'
    mkdir '$DEST.new'
    tar -xzf - -C '$DEST.new'
    chown -R www-data:www-data '$DEST.new'
    rm -rf '$DEST.old'
    if test -d '$DEST'; then mv '$DEST' '$DEST.old'; fi
    mv '$DEST.new' '$DEST'
    rm -rf '$DEST.old'
"
echo "Deployed to $HOST:$DEST"
