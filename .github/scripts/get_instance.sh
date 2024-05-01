#!/usr/bin/env bash

stack_name=$1

printf "\n\n------------------------------------------------------------\n"
printf "Determining instance name based on the following stack name:\n\n"

echo "Stack name: $stack_name"

printf "\n\n------------------------------------------------------------\n\n"

# Determine the proxy instance based on the provided $stack_name
if [[ $stack_name == electronic-prescription-service-api-pr-* ]]; then
    echo "Detected PR stack name"
    # Extracting the PR ID from $stack_name
    pr_id=$(echo "$stack_name" | cut -d'-' -f6)
    # Use proxygen suffix for parallel deployment. Remove when switching to proxygen
    instance=electronic-prescription-service-api-pr-$pr_id-proxygen
else
    echo "Detected non-PR stack name"
    instance=electronic-prescription-service-api
fi

printf "\n\n------------------------------------------------------------\n\n"

echo "$instance"
