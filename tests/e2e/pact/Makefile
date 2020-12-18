SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

test:
	npm run test

create-pacts:
	rm -rf pact
ifeq (sandbox, $(findstring sandbox,$(APIGEE_ENVIRONMENT)))
	npm run create-sandbox-pacts
else
	npm run create-live-pacts
endif

publish-pacts:
	npm run publish-pacts

verify-pacts:
	npm run verify-pacts

generate-postman-collection:
	mkdir -p ../postman/collections
	npm run generate-postman-collection

run-postman-tests:
	npm run run-postman-tests

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses