#!/usr/bin/env bash

stack_name=$1

# Determine the proxy instance based on the provided $stack_name
if [[ $stack_name == psu-pr-* ]]; then
    # Extracting the PR ID from $stack_name
    pr_id=$(echo "$stack_name" | cut -d'-' -f3)
    instance=prescription-status-update-pr-$pr_id
else
    instance=prescription-status-update
fi

echo "$instance"
