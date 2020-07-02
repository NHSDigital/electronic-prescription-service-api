SHELL=/bin/bash -euo pipefail

## Common

all:
	make clean > build.log
	make install >> build.log
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

clean:
	rm -rf dist
	rm -rf models/dist
	rm -rf specification/dist
	rm -rf specification/build
	rm -rf coordinator/dist
	rm -f coordinator/tests/resources/parent-prescription-1/fhir-message.json
	rm -f coordinator/tests/resources/parent-prescription-2/fhir-message.json
	rm -f coordinator/tests/resources/parent-prescription-1/hl7-v3-signed-info-canonicalized.json
	rm -f tests/e2e/electronic-prescription-coordinator-postman-tests.json

## Run

run-specification:
	scripts/set_spec_server_dev.sh
	npm run serve

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
	&& mkdir -p dist/requests \
	&& mkdir -p dist/responses \
	&& mkdir -p dist/schemas \
	&& mkdir -p dist/schemas
	$(foreach file, $(wildcard models/requests/*.yaml), cp $(file) models/dist/requests;)
	$(foreach file, $(wildcard models/requests/*.json), cp $(file) models/dist/requests;)
	$(foreach file, $(wildcard models/requests/*.yaml), poetry run python scripts/yaml2json.py $(file) models/dist/requests;)
	$(foreach file, $(wildcard models/responses/*.xml), cp $(file) models/dist/responses;)
	$(foreach file, $(wildcard models/responses/*.yaml), cp $(file) models/dist/responses;)
	$(foreach file, $(wildcard models/responses/*.json), cp $(file) models/dist/responses;)
	$(foreach file, $(wildcard models/responses/*.yaml), poetry run python scripts/yaml2json.py $(file) models/dist/responses;)
	$(foreach file, $(wildcard models/schemas/*.yaml), cp $(file) models/dist/schemas;)
	$(foreach file, $(wildcard models/schemas/*.json), cp $(file) models/dist/schemas;)
	$(foreach file, $(wildcard models/schemas/*.yaml), poetry run python scripts/yaml2json.py $(file) models/dist/schemas;)


build-specification:
	cd specification \
	&& mkdir -p build/components/examples \
	&& mkdir -p build/components/schemas \
	&& cp -r ../models/dist/requests/*.yaml build/components/examples \
	&& cp -r ../models/dist/responses/*.yaml build/components/examples \
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
	cp models/dist/requests/PrepareSuccessRequest.json coordinator/tests/resources/parent-prescription-1/fhir-message.json
	cp models/dist/requests/PrepareSuccessNominatedPharmacyRequest.json coordinator/tests/resources/parent-prescription-2/fhir-message.json
	cp models/dist/responses/PrepareSuccessResponse.json  coordinator/tests/resources/parent-prescription-1/hl7-v3-signed-info-canonicalized.json
	cp models/dist/responses/ConvertWrapper.xml coordinator/src/resources/ConvertWrapper.xml
	npm run --prefix=coordinator/ build
	cp coordinator/package.json coordinator/dist/
	cp coordinator/src/resources/ConvertWrapper.xml coordinator/dist/resources/
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
	&& export API_TEST_ENV_FILE_PATH=$(or $(API_TEST_ENV_FILE_PATH),../tests/e2e/environments/local.postman_environment.json) \
	&& npm run integration-test

## Quality Checks

validate-models:
	test -f models/dist/org.hl7.fhir.validator.jar || curl https://storage.googleapis.com/ig-build/org.hl7.fhir.validator.jar > models/dist/org.hl7.fhir.validator.jar
	java -jar models/dist/org.hl7.fhir.validator.jar models/dist/requests/*.json models/dist/responses/*.json -version 4.0.1 -tx n/a | tee /tmp/validation.txt

lint:
	cd specification && npm run lint
	cd coordinator && npm run lint
	poetry run flake8 scripts/*.py --config .flake8
	shellcheck scripts/*.sh

check-licenses:
	cd specification && npm run check-licenses
	cd coordinator && npm run check-licenses
	scripts/check_python_licenses.sh
