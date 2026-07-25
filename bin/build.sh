#!/bin/sh
set -e

# SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
# SPDX-License-Identifier: AGPL-3.0-or-later

. "$(dirname "$0")/lib/env.sh"
cd "$ROOT"

echo "Installing npm dependencies..."
npm install

echo "Building..."
npm run build
