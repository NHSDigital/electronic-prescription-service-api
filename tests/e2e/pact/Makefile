SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

create:
	npm t

publish:
	./broker/publish.sh


# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses