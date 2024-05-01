#!/usr/bin/env bash

printf "\n\n------------------------------------------------------------"
printf "Deploying API to Apigee with the following configuration:\n\n"

echo "Proxygen path: $PROXYGEN_PATH"
echo "Specification version: $VERSION_NUMBER"
echo "Stack name: $STACK_NAME"
echo "Apigee environment: $APIGEE_ENVIRONMENT"

printf "\n\n------------------------------------------------------------\n\n"

# Get the directory of the script for callouts
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script directory: $SCRIPT_DIR"

# Determine the proxy instance based on the provided $STACK_NAME
instance=$(sh "$SCRIPT_DIR"/get_instance.sh "$STACK_NAME")
echo "Using instance name: $instance"

# Configure the specification file
echo "Configuring the specification file..."
sh "$SCRIPT_DIR"/config/configure_spec.sh \
    "$instance" "$VERSION_NUMBER" "$APIGEE_ENVIRONMENT"

# Configure Proxygen CLI
echo "Configuring Proxygen CLI..."
sh "$SCRIPT_DIR"/config/configure_proxygen.sh

# Deploy the API image to ECR
echo "Deploying the FHIR Facade image to ECR..."
sh "$SCRIPT_DIR"/publish_containers.sh "eps-fhir-facade" "$VERSION_NUMBER"
echo "Deploying the EPS Validator image to ECR..."
sh //publish_containers.sh "eps-validator" "$VERSION_NUMBER"

# Configure mutual TLS certs
echo "Configuring mutual TLS certs..."
sh "$SCRIPT_DIR"/config/configure_mtls.sh

# Store the API key secret using Proxygen CLI
echo "Storing MTLS certs as a secret..."
"$PROXYGEN_PATH" secret put --mtls-cert ~/.proxygen/tmp/client_cert.pem --mtls-key ~/.proxygen/tmp/client_private_key.pem "$APIGEE_ENVIRONMENT" eps-mtls-1

# Deploy the API instance using Proxygen CLI
echo "Deploying the API instance..."
"$PROXYGEN_PATH" instance deploy --no-confirm "$APIGEE_ENVIRONMENT" "$instance" "specification.json"

printf "\n\nDone deploying the API to Apigee"
printf "------------------------------------------------------------\n\n"
