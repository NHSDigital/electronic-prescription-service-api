SHELL=/bin/bash -euo pipefail

install: install-node install-python install-fhir-validator install-hooks

install-python:
	poetry install

install-node:
	npm install
	cd sandbox && npm install

install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit

install-fhir-validator:
	mkdir -p bin
	test -f bin/org.hl7.fhir.validator.jar || curl https://storage.googleapis.com/ig-build/org.hl7.fhir.validator.jar > bin/org.hl7.fhir.validator.jar

run-sandbox: build-spec build-sandbox
	cd sandbox && npm run start

run-spec-viewer: build-spec build-sandbox
	scripts/set_spec_server_dev.sh
	npm run serve

build-spec:
	mkdir -p build
	npm run publish 2> /dev/null

build-sandbox:
	mkdir -p build/examples
	poetry run python scripts/generate_examples.py build/electronic-prescription-service-api.json build/examples
	mkdir -p sandbox/mocks
	jq -rM . <build/examples/requests/paths._Prescription.post.requestBody.content.application_fhir+json.examples.example.value.json >sandbox/mocks/PrescriptionPostSuccessRequest.json
	jq -rM . <build/examples/responses/paths._Prescription.post.responses.200.content.application_fhir+json.examples.example.value.json >sandbox/mocks/PrescriptionPostSuccessResponse.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.success.value.json >sandbox/mocks/PrescriptionPutSuccessRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.patient-deceased.value.json >sandbox/mocks/PrescriptionPutErrorPatientDeceasedRequest.
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.duplicate-prescription.value.json >sandbox/mocks/PrescriptionPutErrorDuplicatePrescriptionRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.digital-signature-not-found.value.json >sandbox/mocks/PrescriptionPutErrorDigitalSignatureNotFoundRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.patient-not-found.value.json >sandbox/mocks/PrescriptionPutErrorPatientNotFoundRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.information-missing.value.json >sandbox/mocks/PrescriptionPutErrorInformationMissingRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.invalid-message.value.json >sandbox/mocks/PrescriptionPutErrorInvalidMessageRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.incorrect-item-count.value.json >sandbox/mocks/PrescriptionPutErrorIncorrectItemCountRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.authorised-repeat-mismatch.value.json >sandbox/mocks/PrescriptionPutErrorAuthorisedRepeatMismatchRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.incorrect-repeat-number.value.json >sandbox/mocks/PrescriptionPutErrorIncorrectRepeatNumberRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.incompatible-version.value.json >sandbox/mocks/PrescriptionPutErrorIncompatibleVersionResponse.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.duplicate-item-id.value.json >sandbox/mocks/PrescriptionPutErrorDuplicateItemIdRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.check-digit-error.value.json >sandbox/mocks/PrescriptionPutErrorCheckDigitErrorRequest.json
	jq -rM . <build/examples/requests/paths._Prescription.put.requestBody.content.application_fhir+json.examples.invalid-date-format.value.json >sandbox/mocks/PrescriptionPutErrorInvalidDateFormatRequest.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.200.content.application_fhir+json.examples.example.value.json >sandbox/mocks/PrescriptionPutSuccessResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.patient-deceased.value.json >sandbox/mocks/PrescriptionPutErrorPatientDeceasedResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.duplicate-prescription.value.json >sandbox/mocks/PrescriptionPutErrorDuplicatePrescriptionResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.digital-signature-not-found.value.json >sandbox/mocks/PrescriptionPutErrorDigitalSignatureNotFoundResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.patient-not-found.value.json >sandbox/mocks/PrescriptionPutErrorPatientNotFoundResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.information-missing.value.json >sandbox/mocks/PrescriptionPutErrorInformationMissingResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.invalid-message.value.json >sandbox/mocks/PrescriptionPutErrorInvalidMessageResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.incorrect-item-count.value.json >sandbox/mocks/PrescriptionPutErrorIncorrectItemCountResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.authorised-repeat-mismatch.value.json >sandbox/mocks/PrescriptionPutErrorAuthorisedRepeatMismatchResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.incorrect-repeat-number.value.json >sandbox/mocks/PrescriptionPutErrorIncorrectRepeatNumberResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.incompatible-version.value.json >sandbox/mocks/PrescriptionPutErrorIncompatibleVersionResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.duplicate-item-id.value.json >sandbox/mocks/PrescriptionPutErrorDuplicateItemIdResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.check-digit-error.value.json >sandbox/mocks/PrescriptionPutErrorCheckDigitErrorResponse.json
	jq -rM . <build/examples/responses/paths._Prescription.put.responses.5XX.content.application_fhir+json.examples.invalid-date-format.value.json >sandbox/mocks/PrescriptionPutErrorInvalidDateFormatResponse.json

build-proxy:
	scripts/build_proxy.sh

check-licenses:
	npm run check-licenses
	scripts/check_python_licenses.sh

lint:
	npm run lint
	cd sandbox && npm run lint && cd ..
	poetry run flake8 **/*.py --config .flake8
	find -name '*.sh' | grep -v node_modules | xargs shellcheck

validate: build-sandbox
	java -jar bin/org.hl7.fhir.validator.jar build/examples/**/*application_fhir+json*.json -version 4.0.1 -tx n/a | tee /tmp/validation.txt

test:
	export ENVIRONMENT=$(or $(ENVIRONMENT),local) \
	&& export API_TEST_ENV_FILE_PATH=$(or $(API_TEST_ENV_FILE_PATH),tests/e2e/environments/local.postman_environment.json) \
	&& export API_TEST_URL=$(or $(API_TEST_URL),localhost:9000) \
	&& npm run test

release: build-spec build-sandbox build-proxy
	mkdir -p dist
	tar -zcvf dist/package.tar.gz build
	cp -r terraform dist
	cp -r build/. dist

clean:
	rm -rf build
	rm -rf dist
	rm -rf sandbox/mocks