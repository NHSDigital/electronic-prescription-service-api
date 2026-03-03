#!/usr/bin/env bash

# generic script for removing proxygen deployed apis where the pull request is closed

# set the repo name to be the name of the repo this is running in
REPO_NAME=electronic-prescription-service-api

should_delete_resources_for_pr() {
  PR_RESPONSE=$1

  STATE=$(echo "${PR_RESPONSE}" | jq -r '.state // empty')
  AUTHOR=$(echo "${PR_RESPONSE}" | jq -r '.user.login // empty')
  AUTO_MERGE_ENABLED=$(echo "${PR_RESPONSE}" | jq -r '.auto_merge != null')

  if [ "${STATE}" == "closed" ]; then
    DELETE_REASON="state is closed"
    return 0
  fi

  if [ "${STATE}" == "open" ] && [ "${AUTHOR}" == "dependabot[bot]" ] && [ "${AUTO_MERGE_ENABLED}" != "true" ]; then
    DELETE_REASON="dependabot PR is open but not in merge queue"
    return 0
  fi

  return 1
}

# this should be customised to delete relevant proxygen deployments if they are used
main() {
  echo "Checking fhir prescribing deployments"
  PULL_REQUEST_PROXYGEN_REGEX=fhir-prescribing-pr-
  delete_apigee_deployments "internal-dev" "fhir-prescribing" "FhirPrescribingProxygenPrivateKey" "fhir-prescribing"
  delete_apigee_deployments "internal-dev-sandbox" "fhir-prescribing" "FhirPrescribingProxygenPrivateKey" "fhir-prescribing"

  echo "Checking fhir dispensing deployments"
  PULL_REQUEST_PROXYGEN_REGEX=fhir-dispensing-pr-
  delete_apigee_deployments "internal-dev" "fhir-dispensing" "FhirDispensingProxygenPrivateKey" "fhir-dispensing"
  delete_apigee_deployments "internal-dev-sandbox" "fhir-dispensing" "FhirDispensingProxygenPrivateKey" "fhir-dispensing"
}

delete_apigee_deployments() {
  APIGEE_ENVIRONMENT=$1
  APIGEE_API=$2
  PROXYGEN_PRIVATE_KEY_NAME=$3
  PROXYGEN_KID=$4
  proxygen_private_key_arn=$(aws cloudformation list-exports --query "Exports[?Name=='secrets:${PROXYGEN_PRIVATE_KEY_NAME}'].Value" --output text)

  echo
  echo "checking apigee deployments on ${APIGEE_ENVIRONMENT}"
  echo

  jq -n --arg apiName "${APIGEE_API}" \
            --arg environment "${APIGEE_ENVIRONMENT}" \
            --arg kid "${PROXYGEN_KID}" \
            --arg proxygenSecretName "${proxygen_private_key_arn}" \
            '{apiName: $apiName, environment: $environment, kid, $kid, proxygenSecretName: $proxygenSecretName}' > payload.json

  aws lambda invoke --function-name "lambda-resources-ProxygenPTLInstanceGet" --cli-binary-format raw-in-base64-out --payload file://payload.json out.json > response.json

  if eval "cat response.json | jq -e '.FunctionError' >/dev/null"; then
      echo 'Error calling lambda'
      cat out.json
      exit 1
  fi

  jq -r '.[].name' "out.json" | while read -r i; do
    echo "Checking if apigee deployment $i has open pull request"
    PULL_REQUEST=${i//${PULL_REQUEST_PROXYGEN_REGEX}/}
    echo "Checking pull request id ${PULL_REQUEST}"
    URL="https://api.github.com/repos/NHSDigital/${REPO_NAME}/pulls/${PULL_REQUEST}"
    RESPONSE=$(curl --header "authorization: Bearer ${GITHUB_TOKEN}" "${URL}" 2>/dev/null)
    if should_delete_resources_for_pr "${RESPONSE}"; then
      echo "** going to delete apigee deployment $i as ${DELETE_REASON} **"
      jq -n --arg apiName "${APIGEE_API}" \
                --arg environment "${APIGEE_ENVIRONMENT}" \
                --arg instance "${i}" \
                --arg kid "${PROXYGEN_KID}" \
                --arg proxygenSecretName "${proxygen_private_key_arn}" \
                '{apiName: $apiName, environment: $environment, kid, $kid, proxygenSecretName: $proxygenSecretName, instance: $instance}' > payload.json

      aws lambda invoke --function-name "lambda-resources-ProxygenPTLInstanceDelete" --cli-binary-format raw-in-base64-out --payload file://payload.json out.txt > response.json
        if eval "cat response.json | jq -e '.FunctionError' >/dev/null"; then
            echo 'Error calling lambda'
            cat out.txt
            exit 1
        fi


    else
      STATE=$(echo "${RESPONSE}" | jq -r '.state // "unknown"')
      AUTHOR=$(echo "${RESPONSE}" | jq -r '.user.login // "unknown"')
      AUTO_MERGE_ENABLED=$(echo "${RESPONSE}" | jq -r '.auto_merge != null')
      echo "not going to delete apigee deployment $i as state=${STATE}, author=${AUTHOR}, auto_merge_enabled=${AUTO_MERGE_ENABLED}"
    fi
  done
}

main
