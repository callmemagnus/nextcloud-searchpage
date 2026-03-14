#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# e2e-local.sh — run e2e tests against a single Nextcloud Docker container
#
# Usage: bin/e2e-local.sh [--no-cleanup] [--use-existing]
#
#   --no-cleanup     Skip stopping the container before and after the run.
#                    Useful for faster iteration when the container is already
#                    warmed up and the app is installed.
#
#   --use-existing   Skip container setup entirely (no start, no wait, no
#                    configure). Still installs dependencies and builds.
#                    Assumes a Nextcloud container is already running and
#                    configured. Implies --no-cleanup.
# ---------------------------------------------------------------------------

CLEANUP=true
USE_EXISTING=false
for arg in "$@"; do
    case $arg in
        --no-cleanup)   CLEANUP=false ;;
        --use-existing) USE_EXISTING=true; CLEANUP=false ;;
    esac
done

root=$(git rev-parse --show-toplevel)
cd "$root"

# --- Version detection -------------------------------------------------------

NC_VERSION=$(sed -n 's/.*max-version="\([^"]*\)".*/\1/p' appinfo/info.xml)
if test -z "$NC_VERSION"; then
    echo "ERROR: could not parse max-version from appinfo/info.xml"
    exit 1
fi
echo "Nextcloud version: $NC_VERSION"

PLAYWRIGHT_VERSION=$(jq -r '.devDependencies["@playwright/test"]' package.json)
if test -z "$PLAYWRIGHT_VERSION" || test "$PLAYWRIGHT_VERSION" = "null"; then
    echo "ERROR: could not read @playwright/test version from package.json"
    exit 1
fi
echo "Playwright version: $PLAYWRIGHT_VERSION"

HOST_IP=$(ip route get 1 | head -1 | cut -d' ' -f7)
if test -z "$HOST_IP"; then
    echo "ERROR: could not detect host IP"
    exit 1
fi
echo "Host IP: $HOST_IP"

CONTAINER_NAME="nextcloud${NC_VERSION}"
PORT="80${NC_VERSION}"
IMAGE=ghcr.io/juliusknorr/nextcloud-dev-php83:latest

# Ensure container is stopped on exit (unless --no-cleanup)
cleanup() {
    # shellcheck disable=SC2317
    if $CLEANUP ; then
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "Cleaning up ${CONTAINER_NAME}..."
            docker kill "$CONTAINER_NAME" >/dev/null 2>&1 || true
        fi
    fi
}
trap cleanup EXIT

# --- Install dependencies and build ------------------------------------------

echo "Installing npm dependencies..."
npm install

echo "Building all workspaces..."
npm run build

if ! $USE_EXISTING; then

    # --- Pre-run cleanup -----------------------------------------------------

    if $CLEANUP; then
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "Stopping existing container ${CONTAINER_NAME}..."
            docker kill "$CONTAINER_NAME" >/dev/null
        fi
    fi

    # --- Fetch the latest release tag for this NC version --------------------

    TODAY=$(date "+%Y-%m-%d")
    CACHE=$HOME/.cache/nextcloud-dev/$TODAY
    mkdir -p "$CACHE"

    ALL_RELEASES=$CACHE/all_releases.json
    if test ! -e "$ALL_RELEASES"; then
        gh api '/repos/nextcloud/server/releases?per_page=300' >"$ALL_RELEASES"
    fi

    NC_RELEASE=$(jq -r '.[] | .tag_name' "$ALL_RELEASES" \
        | grep -v rc | grep -v beta \
        | grep "^v${NC_VERSION}" \
        | sort -V -r \
        | head -1)

    if test -z "$NC_RELEASE"; then
        echo "ERROR: could not find a release for Nextcloud ${NC_VERSION}"
        exit 1
    fi
    echo "Using Nextcloud release: $NC_RELEASE"

    # --- Start container -----------------------------------------------------

    echo "Starting ${CONTAINER_NAME} on port ${PORT}..."
    docker run \
        --rm \
        -d \
        --name "$CONTAINER_NAME" \
        -p "${PORT}:80" \
        -v "/tmp/nextcloud/${NC_RELEASE}:/var/www/html" \
        -v "${root}:/var/www/html/apps-extra/thesearchpage" \
        -e "SERVER_BRANCH=${NC_RELEASE}" \
        "$IMAGE"

    # --- Wait for app to be installable --------------------------------------

    echo "Waiting for Nextcloud to be ready..."
    ATTEMPTS=0
    MAX_ATTEMPTS=24
    while true; do
        result=$(docker exec -u 33 "$CONTAINER_NAME" php occ app:enable thesearchpage 2>&1 || true)
        if echo "$result" | grep -q "enabled"; then
            echo "App enabled."
            break
        fi
        ATTEMPTS=$((ATTEMPTS + 1))
        if test "$ATTEMPTS" -ge "$MAX_ATTEMPTS"; then
            echo "ERROR: Nextcloud did not become ready after $((MAX_ATTEMPTS * 5)) seconds"
            exit 1
        fi
        echo "Not ready yet, retrying in 5s... ($ATTEMPTS/$MAX_ATTEMPTS)"
        sleep 10
    done

    # --- Configure trusted domains and language ------------------------------

    COUNT=$(docker exec -u 33 "$CONTAINER_NAME" php occ config:system:get trusted_domains | wc -l)
    docker exec -u 33 "$CONTAINER_NAME" php occ config:system:set trusted_domains "$COUNT" --value="$HOST_IP"
    docker exec -u 33 "$CONTAINER_NAME" php occ config:system:set force_language --value en

fi

# --- Run Playwright tests ----------------------------------------------------

echo "Running Playwright tests against NC${NC_VERSION}..."
EXIT_CODE=0
docker run \
    --rm \
    -w /app \
    -e "TARGET_HOST=${HOST_IP}" \
    -e "TARGET_NC_VERSION=${NC_VERSION}" \
    -v "${root}:/app" \
    "mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}" \
    npx playwright test \
    || EXIT_CODE=$?

# Cleanup is handled by the EXIT trap above

exit $EXIT_CODE
