#/bin/sh

docker ps --format '{{.Names}}' | xargs docker kill