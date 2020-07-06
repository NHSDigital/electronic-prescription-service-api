#!/bin/bash
set -euo pipefail

function copy-secret {
    secretValue="$(
        aws secretsmanager get-secret-value \
        --profile build-eps-coordinator \
        --secret-id "$1"
    )"

    aws ssm put-parameter \
        --profile build-eps-coordinator \
        --name "$2" \
        --value "$secretValue" \
        --type SecureString \
        --overwrite
}

copy-secret "ptl/eps/veit07.devspineservices.nhs.uk/private-key" "/ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/private-key"
copy-secret "ptl/eps/veit07.devspineservices.nhs.uk/certificate" "/ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/certificate"

# TODO - REMOVE - Temporary measure for testing
aws ssm put-parameter \
    --profile build-eps-coordinator \
    --name /ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/ca-certs \
    --value "$(cat scripts/ca-certs-int-all.pem)" \
    --type String \
    --overwrite
