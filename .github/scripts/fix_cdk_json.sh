#!/usr/bin/env bash
set -e

# script used to set context key values in cdk.json pre deployment from environment variables

# helper function to set string values
fix_string_key() {
    KEY_NAME=$1
    KEY_VALUE=$2
    if [ -z "${KEY_VALUE}" ]; then
        echo "${KEY_NAME} value is unset or set to the empty string"
        exit 1
    fi
    echo "Setting ${KEY_NAME}"
    jq \
        --arg key_value "${KEY_VALUE}" \
        --arg key_name "${KEY_NAME}" \
        '.context += {($key_name): $key_value}' .build/cdk.json > .build/cdk.new.json
    mv .build/cdk.new.json .build/cdk.json
}

# helper function to set boolean and number values (without quotes)
fix_boolean_number_key() {
    KEY_NAME=$1
    KEY_VALUE=$2
    if [ -z "${KEY_VALUE}" ]; then
        echo "${KEY_NAME} value is unset or set to the empty string"
        exit 1
    fi
    echo "Setting ${KEY_NAME}"
    jq \
        --argjson key_value "${KEY_VALUE}" \
        --arg key_name "${KEY_NAME}" \
        '.context += {($key_name): $key_value}' .build/cdk.json > .build/cdk.new.json
    mv .build/cdk.new.json .build/cdk.json
}

# get some values from AWS
TRUSTSTORE_BUCKET_ARN=$(aws cloudformation describe-stacks --stack-name account-resources --query "Stacks[0].Outputs[?OutputKey=='TrustStoreBucket'].OutputValue" --output text)
TRUSTSTORE_BUCKET_NAME=$(echo "${TRUSTSTORE_BUCKET_ARN}" | cut -d ":" -f 6)
TRUSTSTORE_VERSION=$(aws s3api list-object-versions --bucket "${TRUSTSTORE_BUCKET_NAME}" --prefix "${TRUSTSTORE_FILE}" --query 'Versions[?IsLatest].[VersionId]' --output text)
VPC_ID=$(aws cloudformation list-exports --output json | jq -r '.Exports[] | select(.Name == "vpc-resources:VpcId") | .Value')

CFN_DRIFT_DETECTION_GROUP="prescribe-dispense"
if [[ "$STACK_NAME" =~ -pr-[0-9]+$ ]]; then
  CFN_DRIFT_DETECTION_GROUP="prescribe-dispense-pull-request"
fi

# go through all the key values we need to set
fix_string_key serviceName "${SERVICE_NAME}"
fix_string_key VERSION_NUMBER "${VERSION_NUMBER}"
fix_string_key accountId "${ACCOUNT_ID}"
fix_string_key logRetentionInDays "${LOG_RETENTION_IN_DAYS}"
fix_string_key vpcId "${VPC_ID}"
fix_string_key trustStoreBucketArn "${TRUSTSTORE_BUCKET_ARN}"
fix_string_key trustStoreFile "${TRUSTSTORE_FILE}"
fix_string_key trustStoreVersion "${TRUSTSTORE_VERSION}"
fix_string_key commitId "${COMMIT_ID}"
fix_string_key dockerImageTag "${DOCKER_IMAGE_TAG}"
fix_string_key targetSpineServer "${TARGET_SPINE_SERVER}"
fix_string_key logLevel "${LOG_LEVEL}"
fix_string_key toAsid "${TO_ASID}"
fix_string_key toPartyKey "${TO_PARTY_KEY}"
fix_string_key validatorLogLevel "${VALIDATOR_LOG_LEVEL}"
fix_string_key enableDefaultAsidPartyKey "${ENABLE_DEFAULT_ASID_PARTY_KEY}"
fix_string_key defaultPTLAsid "${DEFAULT_PTL_ASID}"
fix_string_key defaultPTLPartyKey "${DEFAULT_PTL_PARTY_KEY}"
fix_string_key sandboxModeEnabled "${SANDBOX_MODE_ENABLED}"
fix_boolean_number_key enableMutualTls "${ENABLE_MUTUAL_TLS}"
fix_string_key SHA1EnabledApplicationIds "${SHA1_ENABLED_APPLICATION_IDS}"
fix_boolean_number_key desiredFhirFacadeCount "${DESIRED_FHIR_FACADE_COUNT}"

# for claims we want to set the desired count to peak claims count if in peak days to avoid lowering it during deployment
day=$(date +%d)  # Get the day of the month
if [[ $day -le 5 || $day -ge 20 ]]; then
    fix_boolean_number_key desiredClaimsCount "${DESIRED_PEAK_CLAIMS_COUNT}"
else
    fix_boolean_number_key desiredClaimsCount "${DESIRED_CLAIMS_COUNT}"
fi
fix_boolean_number_key desiredPeakClaimsCount "${DESIRED_PEAK_CLAIMS_COUNT}"
fix_boolean_number_key desiredOffPeakClaimsCount "${DESIRED_OFF_PEAK_CLAIMS_COUNT}"
fix_boolean_number_key serviceCpu "${SERVICE_CPU}"
fix_boolean_number_key serviceMemory "${SERVICE_MEMORY}"
fix_boolean_number_key serviceCpu "${SERVICE_CPU}"
fix_boolean_number_key serviceMemory "${SERVICE_MEMORY}"
fix_string_key ApigeeEnvironment "${APIGEE_ENVIRONMENT}"
fix_string_key cfnDriftDetectionGroup "${CFN_DRIFT_DETECTION_GROUP}"
