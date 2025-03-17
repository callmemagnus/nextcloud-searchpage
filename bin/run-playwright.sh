#!/bin/sh

root=$(git rev-parse --show-toplevel)

echo root is $root
ip=$(ip route get 1 | head -1 | cut -d' ' -f7)
PLAYWRIGHT_VERSION=$(cat "$root/package.json" | jq -r '.devDependencies["@playwright/test"]')

if test "$PLAYWRIGHT_VERSION" = ""
then
    echo "Cannot get playwright version"
else
    docker run \
        -w /app \
        -e TARGET_HOST=$ip \
        -v $root:/app mcr.microsoft.com/playwright:v$PLAYWRIGHT_VERSION \
        npx playwright test
fi

chown $user $root/test-results
