#!/bin/bash

set -euo pipefail

# Poll deploying API until our deployed version matches the release version
if [ "$APIGEE_ENVIRONMENT" != "prod" ]; then
  envPrefix="$APIGEE_ENVIRONMENT."
fi
url="https://${envPrefix}api.service.nhs.uk/$SERVICE_BASE_PATH/_status"
interval_in_seconds=5
releaseCommit="$(Build.SourceVersion)"
printf "\nPolling %s every %s seconds, until commit is: %s\n" "$url" "$interval_in_seconds" "$releaseCommit"
attempts=0
success=0
until [ $attempts -eq 60 ]; do
  responseData=$(curl -H "apiKey: $(status-endpoint-api-key)" "$url" -s)
  deployedCommit=$(echo "$responseData" | jq -r ".commitId")
  dependenciesUp=$(echo "$responseData" | jq -r ".status")
  if [ "$deployedCommit" == "$releaseCommit" ] && [ "$dependenciesUp" == "pass" ]; then
    success=1
    break
  fi
  ((attempts = attempts + 1))
  sleep $interval_in_seconds
done

if [ $success == 0 ]; then
  echo "Smoke tests failed, API was not ready in time"
  exit 255
fi

if [[ $SERVICE_ARTIFACT_NAME == v* ]]; then
  PACT_VERSION=$STAGE_NAME
  export PACT_VERSION
else
  export PACT_VERSION="$SERVICE_BASE_PATH"
fi

export PACT_PROVIDER_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/$SERVICE_BASE_PATH

if [[ "$APIGEE_ENVIRONMENT" == *"sandbox"* ]]; then
  export PACT_CONSUMER=nhsd-apim-eps-test-client-sandbox
  export PACT_PROVIDER=nhsd-apim-eps-sandbox
else
  export PACT_CONSUMER=nhsd-apim-eps-test-client
  export PACT_PROVIDER=nhsd-apim-eps

  export SIGNING_PRIVATE_KEY_PATH=$(eps_int_private_key.secureFilePath)
  export SIGNING_CERT_PATH=$(eps_int_cert.secureFilePath)

  if [ "$APIGEE_ENVIRONMENT" == "int" ]; then
    export IDP_URL="https://nhsd-apim-testing-$APIGEE_ENVIRONMENT-ns.herokuapp.com"
    docker pull artronics/nhsd-login-docker:latest >/dev/null
    APIGEE_ACCESS_TOKEN=$(docker run --rm artronics/nhsd-login-docker:latest "$IDP_URL")
    export APIGEE_ACCESS_TOKEN
  elif [ "$APIGEE_ENVIRONMENT" == "ref" ]; then
    IDP_URL="$(REF_IDP_URL)"
    export IDP_URL
    REF_CLIENT_ID="$(REF_CLIENT_ID)"
    export REF_CLIENT_ID
    REF_CLIENT_SECRET="$(REF_CLIENT_SECRET)"
    export REF_CLIENT_SECRET
    docker pull booshi/nhsd-login-docker:latest >/dev/null
    APIGEE_ACCESS_TOKEN=$(
      docker run --rm \
        --env CLIENT_ID="$REF_CLIENT_ID" \
        --env CLIENT_SECRET="$REF_CLIENT_SECRET" \
        booshi/nhsd-login-docker:latest \
        "$IDP_URL"
    )
    export APIGEE_ACCESS_TOKEN
  else
    IDP_URL="https://nhsd-apim-testing-$APIGEE_ENVIRONMENT.herokuapp.com"
    export IDP_URL
    docker pull artronics/nhsd-login-docker:latest >/dev/null
    APIGEE_ACCESS_TOKEN=$(docker run --rm artronics/nhsd-login-docker:latest "$IDP_URL")
    export APIGEE_ACCESS_TOKEN
  fi
fi

# Publish
cd "$SERVICE_NAME/$SERVICE_ARTIFACT_NAME/pact"
rm -rf node_modules && npm ci >/dev/null
make create-pacts >/dev/null
chmod +x ./broker/publish.ts
make publish-pacts >/dev/null

# Verify
chmod +x ./broker/verify.ts
make verify-pacts

# Cleanup for PRs
if [[ $SERVICE_ARTIFACT_NAME != v* ]]; then
  curl -X DELETE -u $PACT_BROKER_BASIC_AUTH_USERNAME:$PACT_BROKER_BASIC_AUTH_PASSWORD $PACT_BROKER_URL/pacticipants/$PACT_CONSUMER+$SERVICE_BASE_PATH >/dev/null
fi
