SHELL=/bin/bash -euo pipefail

test-e2e-integration-setup: install create publish

test-e2e-integration-run-sandbox: verify-sandbox

test-e2e-integration-run: verify

install:
	npm install

create:
	npm t

publish:
	./broker/publish.sh

verify:
	./broker/verify-eps.sh

verify-sandbox:
	./broker/verify-eps-sandbox.sh