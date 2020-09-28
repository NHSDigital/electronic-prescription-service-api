#!/bin/bash
set -eu

# coordinator (live)
export CLIENT_KEY=
export CLIENT_CERT=
export ROOT_CA_CERT=
export SUB_CA_CERT=

# coordinator (sandbox)
export SANDBOX=1
export FROM_ASID=200000001285
export TO_ASID=567456789789
export CPA_ID_MAP='[["PORX_IN020101SM31","S20001A000100"],["PORX_IN020102SM31","S20000A000086"],["PORX_IN030101SM32","S20001A000126"]]'
export TO_PARTY_KEY="YES-0000806"
export FROM_PARTY_KEY="T141D-822234"

# pact
export PACT_BROKER_URL=
export PACT_BROKER_BASIC_AUTH_USERNAME=
export PACT_BROKER_BASIC_AUTH_PASSWORD=
export PACT_CONSUMER=nhsd-apim-eps-test-client
export PACT_PROVIDER=nhsd-apim-eps-sandbox
export BUILD_VERSION=electronic-prescriptions-local-$USER
export APIGEE_ENVIRONMENT=internal-dev-sandbox
export APIGEE_ACCESS_TOKEN=
export SERVICE_BASE_PATH=electronic-prescriptions-pr-171
export COMMIT_SHA=8f70bfd1976924c3533bc6f5977d075786e873f8