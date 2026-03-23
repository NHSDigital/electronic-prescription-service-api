SHELL=/bin/bash -euo pipefail
.PHONY: install build test

install:
	cd ../.. && ${MAKE} install-python

build:
	mkdir -p dist/lambdas/test
	poetry build -f -o dist/lambdas/test

test:
	poetry run pytest
