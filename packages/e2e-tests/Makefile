SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm ci

test:
	npm run test

ifndef mode
mode = $(APIGEE_ENVIRONMENT)
endif

create-prescribing-pacts:
	rm -rf pact
	npm run clear-cache
	npm run create-prescribing-pacts

create-pacts:
	rm -rf pact
	npm run clear-cache
ifeq ($(update), false) 
export UPDATE_PRESCRIPTIONS="false"
endif
ifeq (sandbox, $(findstring sandbox,$(mode)))
	npm run create-sandbox-pacts
else
	npm run create-live-pacts
endif

fetch-apigee-access-token:
	npm run fetch-apigee-access-token

verify-pacts:
	npm run verify-pacts

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses
