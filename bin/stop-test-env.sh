#!/bin/sh

for i in $(docker ps --format '{{.Names}}')
do
    echo -n "Checking $i..."
    if [[ "$i" =~ "nextcloud" ]]
    then
        echo " killing."
        docker kill "$i" > /dev/null
    else
        echo " untouched."
    fi
done