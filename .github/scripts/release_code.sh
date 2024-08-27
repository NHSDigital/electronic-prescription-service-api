#!/usr/bin/env bash

set -euo pipefail

echo "$COMMIT_ID"

# Ensure stack_name is set
if [ -z "${stack_name:-}" ]; then
  echo "Error: stack_name is not set."
  exit 1
fi

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
export LATEST_TRUSTSTORE_VERSION

if [ -z "${DOMAIN_NAME_EXPORT}" ]; then
  export DOMAIN_NAME_EXPORT="NOT_SET"
fi

if [ -z "${ZONE_ID_EXPORT}" ]; then
  export ZONE_ID_EXPORT="NOT_SET"
fi

# Debugging: Print the values for verification
echo "DOMAIN_NAME_EXPORT: $DOMAIN_NAME_EXPORT"
echo "ZONE_ID_EXPORT: $ZONE_ID_EXPORT"
echo "ECR_REPOSITORY: $ECR_REPOSITORY"
echo "IMAGE_TAG: $IMAGE_TAG"

# Fetch the ECS cluster name from CloudFormation outputs
ECS_CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" --output text)

# List ECS services in the cluster and find the ECS service name
ECS_SERVICE_NAME=$(aws ecs list-services --cluster "$ECS_CLUSTER_NAME" --query "serviceArns[?contains(@, 'ECSService')]" --output text | awk -F'/' '{print $2}')

# Ensure we have the ECS service name
if [ -z "$ECS_SERVICE_NAME" ]; then
  echo "ECS service name could not be found."
  exit 1
fi

echo "ECS Service Name: $ECS_SERVICE_NAME"

# List ECS tasks in the service
TASK_ARNS=$(aws ecs list-tasks --cluster "$ECS_CLUSTER_NAME" --service-name "$ECS_SERVICE_NAME" --query "taskArns" --output text)

# Describe tasks and fetch the IP address of the validator container
VALIDATOR_IP=""
for TASK_ARN in $TASK_ARNS; do
  TASK_DETAILS=$(aws ecs describe-tasks --cluster "$ECS_CLUSTER_NAME" --tasks "$TASK_ARN" --query "tasks[0].containers[?name=='${stack_name}-validator'].networkInterfaces[0].privateIpv4Address" --output text)
  if [ -n "$TASK_DETAILS" ]; then
    VALIDATOR_IP=$TASK_DETAILS
    break
  fi
done

if [ -n "$VALIDATOR_IP" ]; then
  export VALIDATOR_IP
  echo "Validator IP: $VALIDATOR_IP"
else
  echo "Validator IP not found."
fi

# Change directory and invoke the make command
cd ../../.aws-sam/build || exit
make sam-deploy-package
