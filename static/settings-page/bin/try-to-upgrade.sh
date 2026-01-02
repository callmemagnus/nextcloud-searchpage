#!/bin/sh

root=$(git rev-parse --show-toplevel || echo .)
wd="$(dirname $0)"/..
here=$(pwd)

"${root}"/bin/test-envs.sh start

cd "${wd}" || exit 1

npx npm-check-updates -d -u -t minor --doctorTest "npm run doctor"

git add package*
git commit -m "chore: minor dependency updates"


npx npm-check-updates -d -u -t latest --doctorTest "npm run doctor" \
    --reject "/@typescript\//" \
    --reject "/@playwright\//"

"${root}"/bin/test-envs.sh stop

cd "${here}" || exit 1
