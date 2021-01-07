SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	cd pact \ 
	&& npm install

test:
	npm run --prefix=pact/ test

create-pacts:
	cd pact \
	&& rm -rf pact
ifeq (sandbox, $(findstring sandbox,$(APIGEE_ENVIRONMENT)))
	npm run --prefix=pact/ create-sandbox-pacts
else
	npm run --prefix=pact/ create-live-pacts
endif

publish-pacts:
	npm run --prefix=pact/ publish-pacts

verify-pacts:
	npm run --prefix=pact/ verify-pacts

generate-postman-collection:
	mkdir -p ./postman/collections
	npm run --prefix=pact/ generate-postman-collection

run-postman-tests:
	npm run --prefix=pact/ run-postman-tests

# Quality Checks

lint:
	npm run --prefix=pact/lint

check-licenses:
	npm run --prefix=pact/ check -licenses