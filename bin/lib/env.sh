# Sourced by bin/* scripts. Sets ROOT, NC_VERSION, PLAYWRIGHT_VERSION, HOST_IP.

ROOT=$(git rev-parse --show-toplevel)

if test -z "$NC_VERSION"; then
    NC_VERSION=$(sed -n 's/.*max-version="\([^"]*\)".*/\1/p' "$ROOT/appinfo/info.xml")
    if test -z "$NC_VERSION"; then
        echo "ERROR: could not parse max-version from appinfo/info.xml" >&2
        exit 1
    fi
fi

HOST_IP=$(ip route get 1 | head -1 | cut -d' ' -f7)
if test -z "$HOST_IP"; then
    echo "ERROR: could not detect host IP" >&2
    exit 1
fi
