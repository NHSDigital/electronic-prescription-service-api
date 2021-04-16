#!/bin/bash
set -euo pipefail

function copy-secret {
    secretValue="$(
        aws secretsmanager get-secret-value \
        --profile build-eps-coordinator \
        --secret-id "$1" \
        --query SecretString \
        --output text
    )"

    aws ssm put-parameter \
        --profile build-eps-coordinator \
        --name "$2" \
        --value "$secretValue" \
        --type SecureString \
        --overwrite
}

function copy-parameter {
    secretValue="$(
        aws ssm get-parameter \
        --profile build-eps-coordinator \
        --name "$1" \
        --query Parameter.Value \
        --output text
    )"

    aws ssm put-parameter \
        --profile build-eps-coordinator \
        --name "$2" \
        --value "$secretValue" \
        --type String \
        --overwrite
}

copy-parameter "/ptl/platform-common/veit07.devspineservices.nhs.uk/cpa-id-map" "/ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/cpa-id-map"
copy-parameter "/ptl/platform-common/veit07.devspineservices.nhs.uk/party-key" "/ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/to-party-key"
# todo: prod copy