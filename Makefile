SHELL=/bin/bash -euo pipefail -O globstar

## Common

all:
	make clean > build.log
	make build >> build.log
	make test >> build.log
	make release >> build.log

.PHONY: install build test publish release clean

install: install-node install-python install-hooks

build: build-specification build-coordinator build-validator build-proxies

test: validate-models lint check-licenses test-coordinator
	cd tests/e2e/pact && make test

publish:
	echo Publish

release:
	mkdir -p dist
	cp -r specification/dist/. dist
	rsync -av --progress --copy-links tests/e2e/pact dist --exclude node_modules
	for env in internal-dev-sandbox internal-qa-sandbox sandbox; do \
		cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/test/g' | sed -e 's/{{ SANDBOX_MODE_ENABLED }}/1/g' > dist/ecs-deploy-$$env.yml; \
	done
	for env in internal-dev internal-qa; do \
		cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/test/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-$$env.yml; \
	done
	cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/int/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-int.yml
	cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/ref/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-ref.yml

clean:
	rm -rf dist
	rm -rf models/build
	rm -rf specification/dist
	rm -rf specification/build
	rm -rf coordinator/dist
	rm -f tests/e2e/postman/electronic-prescription-coordinator-postman-tests.json
	rm -f tests/e2e/postman/collections/electronic-prescription-service-collection.json

## Run

run-specification:
	scripts/set_spec_server_dev.sh
	npm run --prefix=specification/ serve

run-coordinator:
	source ./scripts/set_env_vars.sh && cd coordinator/dist && npm run start

run-validator:
	cd validator && \
	java -Xms1500m -Xms1500m -jar target/fhir-validator-*.jar

## Install

install-python:
	poetry install

install-node:
	cd specification && npm install
	cd coordinator && npm install
	cd tests/e2e/pact && make install

install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit

build-specification:
	cd specification \
	&& mkdir -p build/components/examples \
	&& mkdir -p build/components/schemas \
	&& cp ../models/examples/signature.json build/components/examples/. \
	&& cp -r ../models/examples/errors/. build/components/examples/. \
	&& cp -r ../models/examples/. build/components/examples/. \
	&& cp -r ../models/schemas build/components \
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
	mkdir -p coordinator/dist/resources
	cp coordinator/src/resources/ebxml_request.mustache coordinator/dist/resources/
	cp coordinator/src/resources/message_display.mustache coordinator/dist/resources/

build-validator:
	make -C validator build

build-proxies:
	mkdir -p dist/proxies/sandbox
	mkdir -p dist/proxies/live
	cp -Rv proxies/sandbox/apiproxy dist/proxies/sandbox
	cp -Rv proxies/live/apiproxy dist/proxies/live

# Test

test-coordinator:
	cd coordinator \
	&& npm run test

## Quality Checks

validate-models:
	mkdir -p models/build
	test -f models/build/org.hl7.fhir.validator.jar || curl https://storage.googleapis.com/ig-build/org.hl7.fhir.validator.jar > models/build/org.hl7.fhir.validator.jar
	for dir in "errors/**" "secondary-care/**"; do \
		java -jar models/build/org.hl7.fhir.validator.jar models/examples/$$dir/*.json -version 4.0.1 -tx n/a | tee /tmp/validation.txt; \
	done

lint: build
	cd specification && npm run lint
	cd coordinator && npm run lint
	cd tests/e2e/pact && make lint
	poetry run flake8 scripts/*.py --config .flake8
	shellcheck scripts/*.sh

check-licenses:
	cd specification && npm run check-licenses
	cd coordinator && npm run check-licenses
	cd tests/e2e/pact && make check-licenses
	scripts/check_python_licenses.sh
