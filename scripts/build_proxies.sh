#!/bin/bash

set -o nounset errexit pipefail

# Collect the API Proxies and Hosted Targets
# files into dist/proxies/

rm -rf dist/proxies
mkdir -p dist/proxies/sandbox
mkdir -p dist/proxies/live
cp -Rv proxies/sandbox/apiproxy dist/proxies/sandbox
cp -Rv proxies/live/apiproxy dist/proxies/live
mkdir -p dist/proxies/sandbox/apiproxy/resources/hosted
mkdir -p dist/proxies/live/apiproxy/resources/hosted
rsync -av --copy-links --exclude="node_modules" --filter=':- .gitignore' sandbox/ dist/proxies/sandbox/apiproxy/resources/hosted
rsync -av --copy-links --filter=':- .gitignore' coordinator/dist/ dist/proxies/live/apiproxy/resources/hosted
cp coordinator/package.json dist/proxies/live/apiproxy/resources/hosted
cp coordinator/app.yaml dist/proxies/live/apiproxy/resources/hosted