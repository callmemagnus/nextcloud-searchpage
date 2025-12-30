#!/bin/sh

root=$(git rev-parse --show-toplevel)
here=$(pwd)

echo root is $here
ip=$(ip route get 1 | head -1 | cut -d' ' -f7)
PLAYWRIGHT_VERSION=$(cat "$here/package.json" | jq -r '.devDependencies["@playwright/test"]')

if test "$PLAYWRIGHT_VERSION" = ""; then
    echo "Cannot get playwright version"
    exit 1
else
    docker run \
        -w /app \
        -e TARGET_HOST=$ip \
        -v "$here":/app \
        -v "$root"/node_modules:/app/node_modules \
        mcr.microsoft.com/playwright:v$PLAYWRIGHT_VERSION \
        npx playwright test
    exit $?
fi
