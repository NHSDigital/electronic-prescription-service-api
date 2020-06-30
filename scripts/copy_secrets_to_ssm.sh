#!/bin/bash
set -euo pipefail

ptlClientKey=$(
    aws secretsmanager get-secret-value \
    --profile build-eps-coordinator \
    --secret-id ptl/eps/veit07.devspineservices.nhs.uk/client/key
)

aws ssm put-parameter \
    --profile build-eps-coordinator \
    --name /ptl/api-deployment/eps-coordinator/client-key \
    --value "$ptlClientKey" \
    --type SecureString

ptlClientCertificate=$(
    aws secretsmanager get-secret-value \
    --profile build-eps-coordinator \
    --secret-id ptl/eps/veit07.devspineservices.nhs.uk/client/cert
)

aws ssm put-parameter \
    --profile build-eps-coordinator \
    --name /ptl/api-deployment/eps-coordinator/client-cert \
    --value "$ptlClientCertificate" \
    --type SecureString

ptlFromAsid=$(
    aws secretsmanager get-secret-value \
    --profile build-eps-coordinator \
    --secret-id ptl/eps/veit07.devspineservices.nhs.uk/asid
)

aws ssm put-parameter \
    --profile build-eps-coordinator \
    --name /ptl/api-deployment/eps-coordinator/from-asid \
    --value "$ptlFromAsid" \
    --type SecureString
