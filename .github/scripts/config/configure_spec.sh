#!/usr/bin/env bash

instance=$1
version_number=$2
stack_name=$3
aws_environment=$4
apigee_environment=$5

# Find and replace the specification version number 
jq \
    --arg version "$version_number" \
    '.info.version = $version' \
    "specification.json" \
    > temp.json \
    && mv temp.json "specification.json"

# Find and replace the x-nhsd-apim.target.url value
jq \
    --arg stack_name "$stack_name" \
    --arg aws_env "$aws_environment" \
    '.["x-nhsd-apim"].target.url = "https://\($stack_name).\($aws_env).eps.national.nhs.uk"' \
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
