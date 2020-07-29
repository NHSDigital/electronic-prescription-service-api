SHELL=/bin/bash -euo pipefail

# E2E Integration Test Setup

install:
	npm install

create:
	npm t

publish:
	./broker/publish.sh

postman:
    mkdir -p ../postman/collections
	npm run postman

# Quality Checks

lint:
	npm run lint

check-licenses:
	npm run check-licenses