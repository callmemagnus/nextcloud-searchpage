#!/bin/sh

pwd=$(dirname `readlink -f $0`)

echo $pwd

docker run                  \
    --rm                    \
    -d                      \
    --name nextcloud29      \
    -p 8029:80              \
    -v /tmp/nextcloud/29:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v29.0.0rc5 \
    ghcr.io/juliushaertl/nextcloud-dev-php83:latest

docker run                  \
    --rm                    \
    -d                      \
    --name nextcloud28      \
    -p 8028:80              \
    -v /tmp/nextcloud/28:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v28.0.4 \
    ghcr.io/juliushaertl/nextcloud-dev-php83:latest

docker run                  \
    --rm                    \
     -d                     \
    --name nextcloud27      \
    -p 8027:80              \
    -v /tmp/nextcloud/27:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v27.1.8 \
    ghcr.io/juliushaertl/nextcloud-dev-php82:latest

echo "Waiting 40 seconds"



while true
do
    sleep 1s
    result=$(docker exec -u 33 nextcloud29 php occ app:enable thesearchpage)
    if [[ "$result" =~ enabled ]]
    then
        echo "29 - $result" 
        break
    fi
done

while true
do
    sleep 1s
    docker exec -u 33 nextcloud28 php occ app:enable thesearchpage
    if [[ "$result" =~ enabled ]] 
    then
        echo "28 - $result" 
        break
    fi
done

while true
do
    sleep 1s
    docker exec -u 33 nextcloud27 php occ app:enable thesearchpage
    if [[ "$result" =~ enabled ]]
    then
        echo "27 - $result" 
        break
    fi
done
