#!/bin/bash
set -euo pipefail

# Just set this to ptl for the time being. It's hard coded all over the pipeline at the moment anyway.
ACCOUNT=ptl

clientCertificate=$(
    aws secretsmanager get-secret-value \
    --profile build-eps-coordinator \
    --secret-id "$ACCOUNT/eps-coordinator/client-certificate"
)

aws ssm put-parameter \
    --profile build-eps-coordinator \
    --name "$ACCOUNT/eps-coordinator/client-certificate" \
    --value "$clientCertificate" \
    --type SecureString

fromAsid=$(
    aws secretsmanager get-secret-value \
    --profile build-eps-coordinator \
    --secret-id "$ACCOUNT/eps-coordinator/from-asid"
)

aws ssm put-parameter \
    --profile build-eps-coordinator \
    --name "$ACCOUNT/eps-coordinator/from-asid" \
    --value "$fromAsid" \
    --type SecureString
