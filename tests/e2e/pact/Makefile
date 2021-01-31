SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

test:
	npm run test

space :=
space += 
ifndef mode
mode = $(APIGEE_ENVIRONMENT)
endif
ifndef PACT_VERSION
export PACT_VERSION = $(subst $(space),,$(USERNAME))
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

generate-postman-collection:
	mkdir -p ../postman/collections
	npm run postman

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses