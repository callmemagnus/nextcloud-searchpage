# Sourced by bin/* scripts. Exits if the nc-*.sh helpers (not part of this repo) are not on PATH.

for tool in nc-start.sh nc-enable-app.sh nc-stop.sh; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "ERROR: $tool not found on PATH (the nc-*.sh helpers are not part of this repo)" >&2
        exit 1
    fi
done
