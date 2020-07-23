#!/bin/bash

set -o pipefail

docker run --rm -v ${PWD}:${PWD} -e PACT_BROKER_BASE_URL=$PACT_BROKER_URL -e PACT_BROKER_USERNAME=$PACT_BROKER_BASIC_AUTH_USERNAME -e PACT_BROKER_PASSWORD=$PACT_BROKER_BASIC_AUTH_PASSWORD pactfoundation/pact-cli:latest publish ${PWD}/pact/pacts --consumer-app-version $BUILD_VERSION
docker run --rm -v ${PWD}:${PWD} -e PACT_BROKER_BASE_URL=$PACT_BROKER_URL_NEXT -e PACT_BROKER_TOKEN=$PACT_BROKER_TOKEN_NEXT pactfoundation/pact-cli:latest publish ${PWD}/pact/pacts --consumer-app-version $BUILD_VERSION