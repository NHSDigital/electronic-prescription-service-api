#!/usr/bin/env bash

# Retrieve the client private key and cert from AWS Secrets Manager
client_private_key_arn=$(aws cloudformation list-exports --query "Exports[?Name=='account-resources:EpsClientKeySecret'].Value" --output text)
client_cert_arn=$(aws cloudformation list-exports --query "Exports[?Name=='account-resources:EpsClientCertSecret'].Value" --output text)

client_private_key=$(aws secretsmanager get-secret-value --secret-id "${client_private_key_arn}" --query SecretString --output text)
client_cert=$(aws secretsmanager get-secret-value --secret-id "${client_cert_arn}" --query SecretString --output text)

# Save the client private key, and client cert to temporary files
echo "$client_private_key" > ~/.proxygen/tmp/client_private_key.pem
echo "$client_cert" > ~/.proxygen/tmp/client_cert.pem
