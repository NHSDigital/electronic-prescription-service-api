#!/usr/bin/env bash

NEW_VALIDATOR_VERSION=v1.0.203-alpha 

# $(curl -s "https://api.github.com/repos/NHSDigital/validation-service-fhir-r4/releases/latest" | jq -r .tag_name)


sed -i "s/^ARG VALIDATOR_VERSION_TAG=.*/ARG VALIDATOR_VERSION_TAG=${NEW_VALIDATOR_VERSION}/" .devcontaner/Dockerfile
sed -i "s/^          VALIDATOR_VERSION=.*/          VALIDATOR_VERSION=${NEW_VALIDATOR_VERSION}/" azure/templates/run_tests.yml
sed -i "s/^          VALIDATOR_VERSION=.*/          VALIDATOR_VERSION=${NEW_VALIDATOR_VERSION}/" packages/tool/azure/azure-build-pipeline.yml
sed -i "s/^          LATEST_VALIDATOR_VERSION=.*/          LATEST_VALIDATOR_VERSION=${NEW_VALIDATOR_VERSION}/" .github/workflows/sam_package_code.yml
