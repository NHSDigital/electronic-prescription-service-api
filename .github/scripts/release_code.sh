#!/usr/bin/env bash
set -e


# Fetch the artifact bucket
echo "Getting artifact bucket"
artifact_bucket=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "account-resources:ArtifactsBucket") | .Value' | grep -o '[^:]*$')
export artifact_bucket

# Fetch the CloudFormation execution role
echo "Getting cloudformation execution role"
cloud_formation_execution_role=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "ci-resources:CloudFormationExecutionRole") | .Value')
export cloud_formation_execution_role

# Fetch trust store details
echo "Getting truststore details"
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
echo "TARGET_SPINE_SERVER: $TARGET_SPINE_SERVER"  

# Change directory and invoke the make command
cd ../../.aws-sam/build || exit

# fix the deployment file

echo "Fixing samconfig_package_and_deploy file"
echo 

sed -i "s/CHANGE_SHA1_ENABLED_APPLICATION_IDS/${SHA1_ENABLED_APPLICATION_IDS}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_TRUSTSTORE_BUCKET_NAME/${TRUSTSTORE_BUCKET_NAME}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_LATEST_TRUSTSTORE_VERSION/${LATEST_TRUSTSTORE_VERSION}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_TRUSTSTORE_FILE/${TRUSTSTORE_FILE}/g" samconfig_package_and_deploy.toml
# shellcheck disable=SC2154
sed -i "s/CHANGE_enable_mutual_tls/${enable_mutual_tls}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_VERSION_NUMBER/${VERSION_NUMBER}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_COMMIT_ID/${COMMIT_ID}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_LOG_LEVEL/${LOG_LEVEL}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_VALIDATOR_LOG_LEVEL/${VALIDATOR_LOG_LEVEL}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_LOG_RETENTION_DAYS/${LOG_RETENTION_DAYS}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_TARGET_ENVIRONMENT/${TARGET_ENVIRONMENT}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_DOMAIN_NAME_EXPORT/${DOMAIN_NAME_EXPORT}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_ZONE_ID_EXPORT/${ZONE_ID_EXPORT}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_TARGET_SPINE_SERVER/${TARGET_SPINE_SERVER}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_DOCKER_IMAGE_TAG/${DOCKER_IMAGE_TAG}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_TO_ASID/${TO_ASID}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_TO_PARTY_KEY/${TO_PARTY_KEY}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_ENABLE_DEFAULT_ASID_PARTY_KEY/${ENABLE_DEFAULT_ASID_PARTY_KEY}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_DEFAULT_PTL_ASID/${DEFAULT_PTL_ASID}/g" samconfig_package_and_deploy.toml
sed -i "s/CHANGE_DEFAULT_PTL_PARTY_KEY/${DEFAULT_PTL_PARTY_KEY}/g" samconfig_package_and_deploy.toml

cat samconfig_package_and_deploy.toml

echo
echo "******************************************"
echo "Starting deployment"
echo "******************************************"
make sam-deploy-package
