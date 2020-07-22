SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

create:
	npm t

publish:
	./broker/publish.sh

# E2E Integration Test Run

test-e2e-integration-run:
	./broker/verify-eps.sh

test-e2e-integration-run-sandbox:
	./broker/verify-eps-sandbox.sh


# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses