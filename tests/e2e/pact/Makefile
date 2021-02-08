SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

test:
	npm run test

ifndef mode
mode = $(APIGEE_ENVIRONMENT)
endif

create-pacts:
	rm -rf pact
ifeq (sandbox, $(findstring sandbox,$(mode)))
	npm run create-sandbox-pacts
else
	npm run create-live-pacts
endif

publish-pacts:
	npm run publish-pacts

verify-pacts:
	npm run verify-pacts

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses