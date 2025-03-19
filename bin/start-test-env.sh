#!/bin/sh

today=$(date "+%Y-%m-%d")
cache=$HOME/.cache/magnus/nextcloud/$today
if test ! -d "$cache"; then
    mkdir -p "$cache"
fi

all_releases=$cache/all_releases.json
if test ! -e "$all_releases"; then
    gh api /repos/nextcloud/server/releases > "$all_releases"
fi

if test ! -e "$all_releases"; then
    exit 1
fi

releases=$cache/releases.json
cat "$all_releases" | \
    jq -r '.[] | .tag_name' | \
    grep -v rc | \
    grep -v beta | \
    sort -n -r \
    > "$releases"

pwd=$(dirname `readlink -f $0`)
ip=$(ip route get 1 | head -1 | cut -d' ' -f7)

if test "$ip" = ""
then
    echo "no ip found"
fi

echo ip=$ip

# php 8.3
image83=ghcr.io/juliusknorr/nextcloud-dev-php83:latest
for i in 32 31 30 29 28;
do
    latest=$(cat "$releases" | grep $i | head -1)
    if test "$latest" = ""; then
        echo "$i not available"
        continue
    fi
    echo Starting Nextcloud $latest

    docker run \
        --rm \
        -d \
        --name nextcloud$i \
        -p 80$i:80              \
        -v /tmp/nextcloud/$latest:/var/www/html \
        -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
        -e SERVER_BRANCH=$latest \
        $image83
done

#image82=ghcr.io/juliusknorr/nextcloud-dev-php82:latest

echo "Trying to install the application... let's wait for the instances to settle"
sleep 10

for i in 31 30 29 28;
do
    echo Enabling on $i
    while true
    do
        echo "Testing $i..."
        result=$(docker exec -u 33 nextcloud$i php occ app:enable thesearchpage)
        #echo "$i: $result"
        if [[ "$result" =~ "enabled" ]];
        then
            count=$(docker exec -u 33 nextcloud$i php occ config:system:get trusted_domains | wc -l)
            docker exec -u 33 nextcloud$i php occ config:system:set trusted_domains $count --value=$ip
            break
        else
            sleep 5
        fi
    done
done

