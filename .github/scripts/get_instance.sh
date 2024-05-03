#!/bin/bash

stack_name=$1

# Determine the proxy instance based on the provided $stack_name
if [[ "$stack_name" == "electronic-prescription-service-api-pr-*" ]]; then
    # Extracting the PR ID from $stack_name
    pr_id=$(echo "$stack_name" | cut -d'-' -f6)
    # Use proxygen suffix for parallel deployment. Remove when switching to proxygen
    instance=electronic-prescription-service-api-pr-$pr_id-proxygen
else
    instance=electronic-prescription-service-api
fi

echo "$instance"
