#!/usr/bin/env bash

echo "$COMMIT_ID"

# Fetch the artifact bucket
artifact_bucket=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "account-resources:ArtifactsBucket") | .Value' | grep -o '[^:]*$')
export artifact_bucket

# Fetch the CloudFormation execution role
cloud_formation_execution_role=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "ci-resources:CloudFormationExecutionRole") | .Value' )
export cloud_formation_execution_role

# Fetch trust store details
TRUSTSTORE_BUCKET_ARN=$(aws cloudformation describe-stacks --stack-name account-resources --query "Stacks[0].Outputs[?OutputKey=='TrustStoreBucket'].OutputValue" --output text)
TRUSTSTORE_BUCKET_NAME=$(echo "${TRUSTSTORE_BUCKET_ARN}" | cut -d ":" -f 6)
LATEST_TRUSTSTORE_VERSION=$(aws s3api list-object-versions --bucket "${TRUSTSTORE_BUCKET_NAME}" --prefix "${TRUSTSTORE_FILE}" --query 'Versions[?IsLatest].[VersionId]' --output text)
export LATEST_TRUSTSTORE_VERSION

if [ -z "${DOMAIN_NAME_EXPORT}" ]; then
  export DOMAIN_NAME_EXPORT="NOT_SET"
fi

if [ -z "${ZONE_ID_EXPORT}" ]; then
  export ZONE_ID_EXPORT="NOT_SET"
fi

# Fetch the VPC and subnets
VPC=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "DefaultVPCId") | .Value')
if [ -z "${VPC}" ]; then
  echo "Environment variable VPC not set"
  exit 1
fi
export VPC

SUBNET_A=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "vpc-resources:PrivateSubnetA") | .Value')
if [ -z "${SUBNET_A}" ]; then
  echo "Environment variable SUBNET_A not set"
  exit 1
fi
export SUBNET_A

SUBNET_B=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "vpc-resources:PrivateSubnetB") | .Value')
if [ -z "${SUBNET_B}" ]; then
  echo "Environment variable SUBNET_B not set"
  exit 1
fi
export SUBNET_B

SUBNET_C=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "vpc-resources:PrivateSubnetC") | .Value')
if [ -z "${SUBNET_C}" ]; then
  echo "Environment variable SUBNET_C not set"
  exit 1
fi
export SUBNET_C

# Debugging: Print the values for verification
echo "DOMAIN_NAME_EXPORT: $DOMAIN_NAME_EXPORT"
echo "ZONE_ID_EXPORT: $ZONE_ID_EXPORT"
echo "VPC: $VPC"
echo "SUBNET_A: $SUBNET_A"
echo "SUBNET_B: $SUBNET_B"
echo "SUBNET_C: $SUBNET_C"

# Change directory and invoke the make command
cd ../../.aws-sam/build || exit
make sam-deploy-package
