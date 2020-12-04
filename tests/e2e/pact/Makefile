SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

test:
	npm run test

create-pacts:
	rm -rf pact
	npm run create-pacts

publish-pacts:
	npm run publish-pacts

verify-pacts:
	npm run verify-pacts
	npm run verify-convert-pacts
	ifneq (,$(findstring sandbox,$(APIGEE_ENVIRONMENT)))
		npm run verify-auth-pacts
	endif

generate-postman-collection:
	mkdir -p ../postman/collections
	npm run postman

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses