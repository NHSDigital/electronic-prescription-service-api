#!/bin/bash

set -o pipefail

if [ -z "$PACT_BROKER_TOKEN" ]
then
    docker run --rm -v ${PWD}:${PWD} -e PACT_BROKER_BASE_URL=$PACT_BROKER_URL -e PACT_BROKER_TOKEN=$PACT_BROKER_TOKEN pactfoundation/pact-cli:latest publish ${PWD}/pact/pacts --consumer-app-version $BUILD_VERSION
else
    docker run --rm -v ${PWD}:${PWD} -e PACT_BROKER_BASE_URL=$PACT_BROKER_URL -e PACT_BROKER_USERNAME=$PACT_BROKER_BASIC_AUTH_USERNAME -e PACT_BROKER_PASSWORD=$PACT_BROKER_BASIC_AUTH_PASSWORD pactfoundation/pact-cli:latest publish ${PWD}/pact/pacts --consumer-app-version $BUILD_VERSION
fi