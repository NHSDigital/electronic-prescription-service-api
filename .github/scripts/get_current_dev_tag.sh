#!/usr/bin/env bash

dev_tag=$(aws cloudformation describe-stacks --stack-name prescribe-dispense --query "Stacks[0].Tags[?Key=='version'].Value" --output text)

echo "DEV_TAG=${dev_tag}" >> "$GITHUB_ENV"
