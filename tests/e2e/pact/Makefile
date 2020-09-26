SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

create:
	npm run create

publish:
	npm run publish

verify:
	npm run verify

postman:
	mkdir -p ../postman/collections
	npm run postman

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses