#!/usr/bin/env bash

printf "\n------------------------------------------------------------\n"
printf "Configuring Proxygen CLI\n"

# Create the .proxygen/tmp directory if it doesn't exist
mkdir -p ~/.proxygen/tmp

# Retrieve proxygen private key from AWS Secrets Manager and save it to a temporary file
echo "Retrieving proxygen private key..."
proxygen_private_key_arn=$(aws cloudformation list-exports --query "Exports[?Name=='account-resources:ProxgenPrivateKey'].Value" --output text)
echo "Retrieving proxygen private key from arn""${proxygen_private_key_arn}""..."
proxygen_private_key=$(aws secretsmanager get-secret-value --secret-id "${proxygen_private_key_arn}" --query SecretString --output text)
echo "$proxygen_private_key" > ~/.proxygen/tmp/proxygen_private_key.pem

if [ -z "$proxygen_private_key" ]; then
    echo "Proxygen private key not found"
    exit 1
fi

# Create credentials.yaml file
echo "Creating credentials.yaml..."
cat <<EOF > ~/.proxygen/credentials.yaml
client_id: electronic-prescription-service-api-client
key_id: eps-cli-key-1
private_key_path: tmp/proxygen_private_key.pem
base_url: https://identity.prod.api.platform.nhs.uk/realms/api-producers
client_secret: https://nhsdigital.github.io/identity-service-jwks/jwks/paas/electronic-prescription-service-api.json
EOF

# Create settings.yaml file
echo "Creating settings.yaml..."
cat <<EOF > ~/.proxygen/settings.yaml
api: electronic-prescription-service-api
endpoint_url: https://proxygen.prod.api.platform.nhs.uk
spec_output_format: json
EOF

printf "\nDone configuring Proxygen CLI"
printf "\n------------------------------------------------------------\n"
