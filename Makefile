SHELL=/bin/bash -euo pipefail

## Common

all:
	make clean > build.log
	make build >> build.log
	make test >> build.log
	make release >> build.log

install: install-node install-python install-hooks

build: build-models build-specification build-coordinator build-proxies

test: validate-models lint check-licenses test-coordinator

release:
	mkdir -p dist
	cp -r specification/dist/. dist
	cp -r terraform dist
	mdkir -p dist/pact
	cp -r tests/e2e/pact/broker/verify-* pact-broker

clean:
	rm -rf dist
	rm -rf models/dist
	rm -rf specification/dist
	rm -rf specification/build
	rm -rf coordinator/dist
	rm -f tests/e2e/postman/electronic-prescription-coordinator-postman-tests.json

## Run

run-specification:
	scripts/set_spec_server_dev.sh
	npm run --prefix=specification/ serve

run-coordinator:
	source ./scripts/set_env_vars.sh && cd coordinator/dist && npm run start

## Install

install-python:
	poetry install

install-node:
	cd specification && npm install
	cd coordinator && npm install

install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit

# Build

build-models:
	cd models \
	&& mkdir -p dist/examples \
	&& mkdir -p dist/schemas
	$(foreach directory, $(wildcard models/examples/*), cp -r $(directory) models/dist/examples;)
	# TODO - convert YAML to JSON if needed - $(foreach directory, $(wildcard models/dist/examples/*), $(foreach file, $(wildcard $(directory)/*.yaml), poetry run python scripts/yaml2json.py $(file) $(directory););)
	$(foreach file, $(wildcard models/schemas/*.yaml), cp $(file) models/dist/schemas;)
	$(foreach file, $(wildcard models/schemas/*.json), cp $(file) models/dist/schemas;)
	$(foreach file, $(wildcard models/schemas/*.yaml), poetry run python scripts/yaml2json.py $(file) models/dist/schemas;)


build-specification:
	cd specification \
	&& mkdir -p build/components/examples \
	&& mkdir -p build/components/schemas \
	&& cp -r ../models/dist/examples/* build/components/examples \
	&& cp -r ../models/dist/schemas/*.yaml build/components/schemas \
	&& cp electronic-prescription-service-api.yaml build/electronic-prescription-service-api.yaml \
	&& npm run resolve \
	&& poetry run python ../scripts/yaml2json.py build/electronic-prescription-service-api.resolved.yaml build/ \
	&& cat build/electronic-prescription-service-api.resolved.json | poetry run python ../scripts/set_version.py > build/electronic-prescription-service-api.json \
	&& mkdir -p build/examples \
	&& poetry run ../scripts/generate_specification_examples.py build/electronic-prescription-service-api.json build/examples \
	&& mkdir -p dist \
	&& cp build/electronic-prescription-service-api.json dist/electronic-prescription-service-api.json

build-coordinator:
	npm run --prefix=coordinator/ build
	cp coordinator/package.json coordinator/dist/
	cp coordinator/src/resources/ConvertWrapper.mustache coordinator/dist/resources/
	cp coordinator/src/resources/ebxml_request.mustache coordinator/dist/resources/
	poetry run scripts/update_coordinator_tests.py

build-proxies:
	mkdir -p dist/proxies/sandbox
	mkdir -p dist/proxies/live
	cp -Rv proxies/sandbox/apiproxy dist/proxies/sandbox
	cp -Rv proxies/live/apiproxy dist/proxies/live

# Test

test-coordinator:
	cd coordinator \
	&& npm run test

# Integration Test

test-integration-coordinator:
	cd coordinator \
	&& export API_TEST_ENV_FILE_PATH=$(or $(API_TEST_ENV_FILE_PATH),../tests/e2e/postman/environments/local.postman_environment.json) \
	&& npm run integration-test

## Quality Checks

validate-models:
	test -f models/dist/org.hl7.fhir.validator.jar || curl https://storage.googleapis.com/ig-build/org.hl7.fhir.validator.jar > models/dist/org.hl7.fhir.validator.jar
	java -jar models/dist/org.hl7.fhir.validator.jar models/dist/examples/*/*.json -version 4.0.1 -tx n/a | tee /tmp/validation.txt

lint:
	cd specification && npm run lint
	cd coordinator && npm run lint
	poetry run flake8 scripts/*.py --config .flake8
	shellcheck scripts/*.sh

check-licenses:
	cd specification && npm run check-licenses
	cd coordinator && npm run check-licenses
	scripts/check_python_licenses.sh
