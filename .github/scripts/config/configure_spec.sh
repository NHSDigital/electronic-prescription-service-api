#!/usr/bin/env bash

instance=$1
version_number=$2
apigee_environment=$3

# Find and replace the specification version number 
jq \
    --arg version "$version_number" \
    '.info.version = $version' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"

# Find and replace the servers object
if [[ $apigee_environment == prod ]]; then
    jq \
    --arg inst "$instance" \
    '.servers = [ { "url": "https://api.service.nhs.uk/\($inst)" } ]' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"
else
    jq \
    --arg env "$apigee_environment" \
    --arg inst "$instance" \
    '.servers = [ { "url": "https://\($env).api.service.nhs.uk/\($inst)" } ]' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"
fi
