#!/bin/sh

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later

SUCCESS_MSG="🚀🚀🚀🚀 Build is ready"
SUCCESS_MS=2000
FAILURE_MSG="📛📛📛📛 Build failed"
FAILURE_MS=5000

missing_lib() {
	echo "Missing $1"
	exit 1
}

whereis entr || missing_lib entr
whereis notify-send || missing_lib notify-send

  find static | entr -s "\
    npm run build -- -m dev \
      && \
      notify-send -t $SUCCESS_MS \"$SUCCESS_MSG\" \
      || \
      notify-send -t $FAILURE_MS \"$FAILURE_MSG\" \
"

