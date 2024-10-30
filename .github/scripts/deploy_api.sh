#!/usr/bin/env bash
set -eu pipefail

echo "FHIR Prescribing specification path: ${SPEC_PATH_PRESCRIBING}"
echo "FHIR Dispensing specification path: ${SPEC_PATH_DISPENSING}"
echo "Specification version: ${VERSION_NUMBER}"
echo "Stack name: ${STACK_NAME}"
echo "AWS environment: ${AWS_ENVIRONMENT}"
echo "Apigee environment: ${APIGEE_ENVIRONMENT}"
echo "Proxygen private key name: ${PROXYGEN_PRIVATE_KEY_NAME}"
echo "Proxygen KID: ${PROXYGEN_KID}"
echo "Dry run: ${DRY_RUN}"
