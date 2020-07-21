SHELL=/bin/bash -euo pipefail

test-e2e-integration-setup: install create publish

install:
	npm install

create:
	npm t

publish:
	export APIGEE_ENVIRONMENT=$(APIGEE_ENVIRONMENT) \
	&& export PACT_BROKER_BASIC_AUTH_USERNAME=$(PACT_BROKER_BASIC_AUTH_USERNAME) \
	&& export PACT_BROKER_BASIC_AUTH_PASSWORD=$(PACT_BROKER_BASIC_AUTH_PASSWORD) \
	&& export PACT_BROKER_URL=$(PACT_BROKER_URL) \
	&& ./broker/publish.sh
