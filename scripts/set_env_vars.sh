#!/bin/bash
set -eu


# coordinator (sandbox)
export SANDBOX=1
export TO_ASID=567456789789
export TO_PARTY_KEY="YES-0000806"
export PRESCRIBE_ENABLED="true"
export DISPENSE_ENABLED="true"
export USE_SHA256_PREPARE=true
#export FROM_PARTY_KEY="T141D-822234"

# pact
export PACT_BROKER_URL=
export PACT_BROKER_BASIC_AUTH_USERNAME=
export PACT_BROKER_BASIC_AUTH_PASSWORD=
export PACT_CONSUMER=nhsd-apim-eps-test-client-sandbox
export PACT_PROVIDER=nhsd-apim-eps-sandbox
#export PACT_PROVIDER=nhsd-apim-eps
#export APIGEE_ACCESS_TOKEN=
export APIGEE_ENVIRONMENT=internal-dev-sandbox
#export APIGEE_ENVIRONMENT=internal-dev
export SERVICE_BASE_PATH=electronic-prescriptions-pr-284
export PACT_VERSION=$SERVICE_BASE_PATH
export PACT_PROVIDER_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/$SERVICE_BASE_PATH
#export PACT_PROVIDER_URL=http://localhost:9000
