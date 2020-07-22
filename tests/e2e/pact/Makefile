SHELL=/bin/bash -euo pipefail

test-e2e-integration-setup: install create publish

test-e2e-integration-run-sandbox: install-verify verify-sandbox

test-e2e-integration-run: install-verify verify

install:
	npm install

create:
	npm t

publish:
	./broker/publish.sh

verify:
	export PACT_BROKER_BASIC_AUTH_USERNAME=$(PACT_BROKER_BASIC_AUTH_USERNAME) \
	&& export PACT_BROKER_BASIC_AUTH_PASSWORD=$(PACT_BROKER_BASIC_AUTH_PASSWORD) \
	&& export PACT_BROKER_URL=$(PACT_BROKER_URL) \
	&& ./broker/verify-eps.sh

verify-sandbox:
	export PACT_BROKER_BASIC_AUTH_USERNAME=$(PACT_BROKER_BASIC_AUTH_USERNAME) \
	&& export PACT_BROKER_BASIC_AUTH_PASSWORD=$(PACT_BROKER_BASIC_AUTH_PASSWORD) \
	&& export PACT_BROKER_URL=$(PACT_BROKER_URL) \
	&& ./broker/verify-eps-sandbox.sh

install-verify:
	cd broker \
	&& curl -LO https://github.com/pact-foundation/pact-ruby-standalone/releases/download/v1.86.0/pact-1.86.0-linux-x86_64.tar.gz \
	&& tar xzf pact-1.86.0-linux-x86_64.tar.gz \
	&& rm pact-1.86.0-linux-x86_64.tar.gz