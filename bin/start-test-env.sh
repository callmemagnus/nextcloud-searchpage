#!/bin/sh

pwd=$(dirname `readlink -f $0`)

echo $pwd

docker run                  \
    --rm                    \
    -d                      \
    --name nextcloud30      \
    -p 8030:80              \
    -v /tmp/nextcloud/30:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v30.0.0 \
    ghcr.io/juliushaertl/nextcloud-dev-php83:latest

docker run                  \
    --rm                    \
    -d                      \
    --name nextcloud29      \
    -p 8029:80              \
    -v /tmp/nextcloud/29:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v29.0.6 \
    ghcr.io/juliushaertl/nextcloud-dev-php83:latest

docker run                  \
    --rm                    \
    -d                      \
    --name nextcloud28      \
    -p 8028:80              \
    -v /tmp/nextcloud/28:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v28.0.10 \
    ghcr.io/juliushaertl/nextcloud-dev-php83:latest

docker run                  \
    --rm                    \
     -d                     \
    --name nextcloud27      \
    -p 8027:80              \
    -v /tmp/nextcloud/27:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v27.1.11 \
    ghcr.io/juliushaertl/nextcloud-dev-php82:latest

docker run                  \
    --rm                    \
     -d                     \
    --name nextcloud26      \
    -p 8026:80              \
    -v /tmp/nextcloud/26:/var/www/html \
    -v $pwd/..:/var/www/html/apps-extra/thesearchpage \
    -e SERVER_BRANCH=v26.0.13 \
    ghcr.io/juliushaertl/nextcloud-dev-php82:latest

echo "Trying to install the application..."

# while true
# do
#     sleep 1s
#     result=$(docker exec -u 33 nextcloud30 php occ app:enable thesearchpage)
#     if [[ "$result" =~ enabled ]]
#     then
#         echo "30 - $result" 
#         break
#     fi
# done

for i in 30 29 28 27 26;
do
    echo Enabling on $i
    while true
    do
        echo "Testing $i..."
        result=$(docker exec -u 33 nextcloud$i php occ app:enable thesearchpage)
        echo "$i: $result"
        if [[ "$result" =~ "enabled" ]];
        then
            break
        else
            sleep 1
        fi
    done
done

# while true
# do
#     sleep 1s
#     result=$(docker exec -u 33 nextcloud29 php occ app:enable thesearchpage)
#     if [[ "$result" =~ enabled ]]
#     then
#         echo "29 - $result" 
#         break
#     fi
# done

# while true
# do
#     sleep 1s
#     docker exec -u 33 nextcloud28 php occ app:enable thesearchpage
#     if [[ "$result" =~ enabled ]] 
#     then
#         echo "28 - $result" 
#         break
#     fi
# done

# while true
# do
#     sleep 1s
#     docker exec -u 33 nextcloud27 php occ app:enable thesearchpage
#     if [[ "$result" =~ enabled ]]
#     then
#         echo "27 - $result" 
#         break
#     fi
# done



# while true
# do
#     sleep 1s
#     docker exec -u 33 nextcloud26 php occ app:enable thesearchpage
#     if [[ "$result" =~ enabled ]]
#     then
#         echo "26 - $result" 
#         break
#     fi
# done