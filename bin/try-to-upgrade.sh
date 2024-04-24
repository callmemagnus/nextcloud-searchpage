#!/bin/sh

./bin/start-test-env.sh

npx npm-check-updates -d -u -t minor --doctorTest "npm run doctor"

git add package*
git commit -m "chore: minor dependency updates"


npx npm-check-updates -d -u -t latest --doctorTest "npm run doctor" \
    --reject "/@typescript\//" \
    --reject "/@playwright\//"


./bin/stop-test-env.sh

