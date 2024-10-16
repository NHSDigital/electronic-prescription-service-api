#!/usr/bin/env bash

echo "$COMMIT_ID"

# Fetch the artifact bucket
artifact_bucket=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "account-resources:ArtifactsBucket") | .Value' | grep -o '[^:]*$')
export artifact_bucket

# Fetch the CloudFormation execution role
cloud_formation_execution_role=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "ci-resources:CloudFormationExecutionRole") | .Value')
export cloud_formation_execution_role

# Fetch trust store details
TRUSTSTORE_BUCKET_ARN=$(aws cloudformation describe-stacks --stack-name account-resources --query "Stacks[0].Outputs[?OutputKey=='TrustStoreBucket'].OutputValue" --output text)
TRUSTSTORE_BUCKET_NAME=$(echo "${TRUSTSTORE_BUCKET_ARN}" | cut -d ":" -f 6)
LATEST_TRUSTSTORE_VERSION=$(aws s3api list-object-versions --bucket "${TRUSTSTORE_BUCKET_NAME}" --prefix "${TRUSTSTORE_FILE}" --query 'Versions[?IsLatest].[VersionId]' --output text)
export TRUSTSTORE_BUCKET_NAME
export LATEST_TRUSTSTORE_VERSION

if [ -z "${DOMAIN_NAME_EXPORT}" ]; then
  export DOMAIN_NAME_EXPORT="NOT_SET"
fi

if [ -z "${ZONE_ID_EXPORT}" ]; then
  export ZONE_ID_EXPORT="NOT_SET"
fi

# Print the values for verification
echo "DOMAIN_NAME_EXPORT: $DOMAIN_NAME_EXPORT"
echo "ZONE_ID_EXPORT: $ZONE_ID_EXPORT"
echo "TRUSTSTORE_BUCKET_NAME: $TRUSTSTORE_BUCKET_NAME"
echo "LATEST_TRUSTSTORE_VERSION: $LATEST_TRUSTSTORE_VERSION"
echo "SPINE_URL: $SPINE_URL"  

# Change directory and invoke the make command
cd ../../.aws-sam/build || exit
make sam-deploy-package
