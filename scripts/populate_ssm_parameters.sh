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

# test (veit07)
copy-secret "ptl/client/aws.api.veit07.devspineservices.nhs.uk/key" "/ptl/api-deployment/eps-coordinator/certs/spine/test/key"
copy-secret "ptl/client/aws.api.veit07.devspineservices.nhs.uk/crt" "/ptl/api-deployment/eps-coordinator/certs/spine/test/crt"
copy-parameter "/ptl/platform-common/test/host" "/ptl/api-deployment/eps-coordinator/test/host"

# int
copy-secret "ptl/client/aws.api.intspineservices.nhs.uk/key" "/ptl/api-deployment/eps-coordinator/certs/spine/int/key"
copy-secret "ptl/client/aws.api.intspineservices.nhs.uk/crt" "/ptl/api-deployment/eps-coordinator/certs/spine/int/crt"
copy-parameter "/ptl/platform-common/int/host" "/ptl/api-deployment/eps-coordinator/int/host"

# ref
copy-secret "ptl/client/aws.api.intspineservices.nhs.uk/key" "/ptl/api-deployment/eps-coordinator/certs/spine/ref/key"
copy-secret "ptl/client/aws.api.intspineservices.nhs.uk/crt" "/ptl/api-deployment/eps-coordinator/certs/spine/ref/crt"
copy-parameter "/ptl/platform-common/ref/host" "/ptl/api-deployment/eps-coordinator/ref/host"

# ptl envs root & sub ca
copy-secret "ptl/veit07.devspineservices.nhs.uk/root-ca/crt" "/ptl/api-deployment/eps-coordinator/certs/nhsd-root-ca/ptl/crt"
copy-secret "ptl/veit07.devspineservices.nhs.uk/sub-ca/crt" "/ptl/api-deployment/eps-coordinator/certs/nhsd-sub-ca/ptl/crt"

copy-parameter "/ptl/platform-common/veit07.devspineservices.nhs.uk/cpa-id-map" "/ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/cpa-id-map"
copy-parameter "/ptl/platform-common/veit07.devspineservices.nhs.uk/party-key" "/ptl/api-deployment/eps-coordinator/veit07.devspineservices.nhs.uk/to-party-key"
