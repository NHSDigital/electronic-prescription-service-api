SHELL=/bin/bash -euo pipefail

test-e2e-integration-setup: install create-pacts publish-pacts

install:
	npm install

create-pacts:
	npm t

publish-pacts:
	export APIGEE_ENVIRONMENT=$(APIGEE_ENVIRONMENT) \
	&& export PACT_BROKER_BASIC_AUTH_USERNAME=$(PACT_BROKER_BASIC_AUTH_USERNAME) \
	&& export PACT_BROKER_BASIC_AUTH_PASSWORD=$(PACT_BROKER_BASIC_AUTH_PASSWORD) \
	&& export PACT_BROKER_URL=$(PACT_BROKER_URL) \
	&& ./broker/publish.sh
