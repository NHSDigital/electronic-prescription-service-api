#!/bin/bash

aws configure set default.region "eu-west-2"

PERSONAL_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id ${secret_id} --query SecretString --output text)
RUNNER_REGISTRATION_TOKEN=$(curl -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $PERSONAL_ACCESS_TOKEN" https://api.github.com/repos/NHSDigital/NRLF/actions/runners/registration-token | jq -r .token)
sudo runuser -l ubuntu -c "cd /home/ubuntu/actions-runner && ./config.sh --url https://github.com/NHSDigital/NRLF --token $RUNNER_REGISTRATION_TOKEN --unattended --labels ci"
sudo runuser -l ubuntu -c "/home/ubuntu/actions-runner/run.sh"
