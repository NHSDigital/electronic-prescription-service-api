SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

create-pacts:
	npm run create

publish-pacts:
	npm run publish

verify-pacts:
	npm run verify

generate-postman-collection:
	mkdir -p ../postman/collections
	npm run postman

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses