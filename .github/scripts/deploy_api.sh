#!/usr/bin/env bash

echo "Proxygen path: $PROXYGEN_PATH"
echo "Specification version: $VERSION_NUMBER"
echo "Stack name: $STACK_NAME"
echo "Apigee environment: $APIGEE_ENVIRONMENT"

# Determine the proxy instance based on the provided $STACK_NAME
instance=$(sh ./get_instance.sh "$STACK_NAME")

# Configure the specification file
sh ./config/configure_spec.sh \
    "$instance" "$VERSION_NUMBER" "$APIGEE_ENVIRONMENT"

# Configure Proxygen CLI
sh ./config/configure_proxygen.sh

# Deploy the API image to ECR
sh ./publish_containers.sh "eps-fhir-facade" "$VERSION_NUMBER"
sh //publish_containers.sh "eps-validator" "$VERSION_NUMBER"

# Configure mutual TLS certs
sh ./config/configure_mtls.sh

# Store the API key secret using Proxygen CLI
"$PROXYGEN_PATH" secret put --mtls-cert ~/.proxygen/tmp/client_cert.pem --mtls-key ~/.proxygen/tmp/client_private_key.pem "$APIGEE_ENVIRONMENT" eps-mtls-1

# Deploy the API instance using Proxygen CLI
"$PROXYGEN_PATH" instance deploy --no-confirm "$APIGEE_ENVIRONMENT" "$instance" "specification.json"
