#!/usr/bin/env bash
set -e

spec_path=$1
instance=$2
version_number=$3
apigee_environment=$4

printf "\n------------------------------------------------------------\n"
printf "Configuring the specification file with the following configuration:\n"

echo "Specification path: $spec_path"
echo "Instance: $instance"
echo "Version number: $version_number"
echo "Apigee environment: $apigee_environment"

# Find and replace the specification version number 
echo "Updating version number..."
jq \
    --arg version "$version_number" \
    '.info.version = $version' \
    "$spec_path" \
    > temp.json \
    && mv temp.json "$spec_path"

# Find and replace the servers object
echo "Updating servers object..."
if [[ $apigee_environment == prod ]]; then
    echo "...for a prod environment"
    jq \
    --arg inst "$instance" \
    '.servers = [ { "url": "https://api.service.nhs.uk/\($inst)" } ]' \
    "$spec_path" \
    > temp.json \
    && mv temp.json "$spec_path"
else
    echo "...for a non-prod environment"
    jq \
    --arg env "$apigee_environment" \
    --arg inst "$instance" \
    '.servers = [ { "url": "https://\($env).api.service.nhs.uk/\($inst)" } ]' \
    "$spec_path" \
    > temp.json \
    && mv temp.json "$spec_path"
fi

printf "\nDone configuring the specification file"
printf "\n------------------------------------------------------------\n"
