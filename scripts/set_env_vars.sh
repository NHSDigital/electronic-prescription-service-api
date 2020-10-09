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
export APIGEE_ACCESS_TOKEN=
export APIGEE_ENVIRONMENT=internal-dev-sandbox
export SERVICE_BASE_PATH=electronic-prescriptions-pr-189
export PACT_VERSION=$SERVICE_BASE_PATH
export PACT_PROVIDER_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/$SERVICE_BASE_PATH
export PACT_PROVIDER_URL=http://localhost:9000
