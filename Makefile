SHELL=/bin/bash -euo pipefail

install: install-node install-python install-fhir-validator install-hooks

install-python:
	poetry install

install-node:
	npm install
	cd sandbox && npm install
	cd coordinator && npm install

install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit

install-fhir-validator:
	mkdir -p bin
	test -f bin/org.hl7.fhir.validator.jar || curl https://storage.googleapis.com/ig-build/org.hl7.fhir.validator.jar > bin/org.hl7.fhir.validator.jar

run-spec-viewer: build-spec build-sandbox
	scripts/set_spec_server_dev.sh
	npm run serve

run-coordinator: build-coordinator
	cp coordinator/package.json coordinator/dist/
	cd coordinator/dist && npm run start

run-sandbox: build-sandbox
	cd sandbox && npm run start

build-spec:
	mkdir -p build/examples
	npm run publish 2> /dev/null
	poetry run python scripts/generate_examples.py build/electronic-prescription-service-api.json build/examples

build-coordinator:
	cd coordinator && npm run build

build-sandbox: build-spec
	mkdir -p sandbox/mocks
	jq -rM . <build/examples/responses/paths._Prepare.post.responses.200.content.application_json.examples.example.value.json >sandbox/mocks/PrepareSuccessResponse.json
	jq -rM . <build/examples/responses/paths._Send.post.responses.200.content.application_fhir+json.examples.example.value.json >sandbox/mocks/SendSuccessResponse.json
	jq -rM . <build/examples/responses/paths._Send.post.responses.5XX.content.application_fhir+json.examples.patient-deceased.value.json >sandbox/mocks/SendErrorPatientDeceasedResponse.json

build-proxy:
	scripts/build_proxy.sh

check-licenses:
	npm run check-licenses
	cd coordinator && npm run check-licenses && cd ..
	cd sandbox && npm run check-licenses && cd ..
	scripts/check_python_licenses.sh

lint:
	npm run lint
	cd coordinator && npm run lint && cd ..
	cd sandbox && npm run lint && cd ..
	poetry run flake8 scripts/*.py --config .flake8
	shellcheck scripts/*.sh

validate: build-spec
	java -jar bin/org.hl7.fhir.validator.jar build/examples/requests/*application_fhir+json*.json build/examples/responses/*application_fhir+json*.json build/examples/resources/*.json -version 4.0.1 -tx n/a | tee /tmp/validation.txt

test:
	export ENVIRONMENT=$(or $(ENVIRONMENT),local) \
	&& export API_TEST_ENV_FILE_PATH=$(or $(API_TEST_ENV_FILE_PATH),tests/e2e/environments/local.postman_environment.json) \
	&& export API_TEST_URL=$(or $(API_TEST_URL),localhost:9000) \
	&& npm run test
	cd sandbox && npm t && cd ..
	cd coordinator && npm t && cd ..

release: build-coordinator build-proxy
	mkdir -p dist
	tar -zcvf dist/package.tar.gz build
	cp -r terraform dist
	cp -r build/. dist

clean:
	rm -rf build
	rm -rf dist
	rm -rf sandbox/mocks
	rm -rf coordinator/dist
