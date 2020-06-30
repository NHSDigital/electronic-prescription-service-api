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

copy-secret "ptl/eps/veit07.devspineservices.nhs.uk/client/key" "/ptl/api-deployment/eps-coordinator/client-key"
copy-secret "ptl/eps/veit07.devspineservices.nhs.uk/client/cert" "/ptl/api-deployment/eps-coordinator/client-cert"
copy-secret "ptl/eps/veit07.devspineservices.nhs.uk/asid" "/ptl/api-deployment/eps-coordinator/from-asid"
