#!/usr/bin/env bash

stack_name=$1

printf "\n\n------------------------------------------------------------"
printf "Determining instance name based on the following stack name:\n\n"

echo "Stack name: $stack_name"

printf "\n\n------------------------------------------------------------\n\n"

# Determine the proxy instance based on the provided $stack_name
if [[ $stack_name == psu-pr-* ]]; then
    echo "Detected PR stack name"
    # Extracting the PR ID from $stack_name
    pr_id=$(echo "$stack_name" | cut -d'-' -f3)
    instance=prescription-status-update-pr-$pr_id
else
    echo "Detected non-PR stack name"
    instance=prescription-status-update
fi

printf "\n\n------------------------------------------------------------\n\n"

echo "$instance"
