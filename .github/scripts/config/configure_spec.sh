#!/usr/bin/env bash

instance=$1
version_number=$2
apigee_environment=$3

printf "\n\n------------------------------------------------------------"
printf "Configuring the specification file with the following configuration:\n\n"

echo "Instance: $instance"
echo "Version number: $version_number"
echo "Apigee environment: $apigee_environment"

printf "\n\n------------------------------------------------------------\n\n"

# Find and replace the specification version number 
echo "Updating version number..."
jq \
    --arg version "$version_number" \
    '.info.version = $version' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"

# Find and replace the servers object
echo "Updating servers object..."
if [[ $apigee_environment == prod ]]; then
    echo "...for a prod environment"
    jq \
    --arg inst "$instance" \
    '.servers = [ { "url": "https://api.service.nhs.uk/\($inst)" } ]' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"
else
    echo "...for a non-prod environment"
    jq \
    --arg env "$apigee_environment" \
    --arg inst "$instance" \
    '.servers = [ { "url": "https://\($env).api.service.nhs.uk/\($inst)" } ]' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"
fi

printf "\n\nDone configuring the specification file"
printf "------------------------------------------------------------\n\n"
