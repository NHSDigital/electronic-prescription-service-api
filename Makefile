SHELL=/bin/bash -euo pipefail

ifeq ($(shell test -e epsat.release && echo -n yes),yes)
	TEST_TARGET=test-epsat
	RELEASE_TARGET=release-epsat
	INSTALL_TARGET=install-epsat
	LINT_TARGET=lint-epsat
	CHECK_LICENSES_TARGET=check-licenses-epsat
	BUILD_TARGET=build-epsat
else
	TEST_TARGET=test-api
	RELEASE_TARGET=release-api
	INSTALL_TARGET=install-api
	LINT_TARGET=lint-api
	CHECK_LICENSES_TARGET=check-licenses-api
	BUILD_TARGET=build-api
endif

test: $(TEST_TARGET)
release: $(RELEASE_TARGET)
install: $(INSTALL_TARGET)
lint: $(LINT_TARGET)
check-licenses: $(CHECK_LICENSES_TARGET)
build: $(BUILD_TARGET)

## Common

all:
	make clean > build.log
	make build >> build.log
	make test >> build.log
	make release >> build.log

.PHONY: install build test publish release clean

install-api: install-node install-python install-hooks generate-mock-certs

build-api: build-specification build-coordinator build-proxies

build-epsat:
	mkdir -p build/components/examples
	mkdir -p build/components/schemas
	cp examples/signature.json build/components/examples/.
	cp -r examples/spec-errors/. build/components/examples/.
	cp -r examples/. build/components/examples/.
	cp -r ./schemas/. build/components/schemas/.
	cp packages/tool/electronic-prescription-service-api.yaml build/electronic-prescription-service-api.yaml
	npm run resolve
	poetry run python scripts/yaml2json.py build/electronic-prescription-service-api.resolved.yaml build/
	cat build/electronic-prescription-service-api.resolved.json | poetry run python ../../scripts/set_version.py > build/electronic-prescription-service-api.json
	mkdir -p dist
	cp build/electronic-prescription-service-api.json dist/electronic-prescription-service-api.json
	ls -la build/components/schemas/MedicationRequest/extensions

test-api: check-licenses-api generate-mock-certs test-coordinator
	cd packages/e2e-tests && make test
	poetry run pytest ./scripts/update_prescriptions.py

test-epsat: check-licenses-epsat
	cd packages/tool/site/client && npm run test

publish:
	echo Publish

release-api:
	mkdir -p dist/e2e-tests/src/models
	cp -r packages/specification/dist/. dist
	rsync -av --progress --copy-links packages/e2e-tests/ dist/e2e-tests/src --exclude node_modules --exclude pact
	rm -f dist/e2e-tests/src/tsconfig.json && mv dist/e2e-tests/src/tsconfig-deploy.json dist/e2e-tests/src/tsconfig.json
	rsync -av --progress --copy-links examples dist/e2e-tests --exclude build
	rsync -av --progress --copy-links packages/models dist/e2e-tests/src --exclude node_modules
	rsync -av --progress --copy-links packages/coordinator dist/e2e-tests/src --exclude node_modules --exclude tests
	for env in internal-dev-sandbox internal-qa-sandbox sandbox; do \
		cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/veit07/g' | sed -e 's/{{ SANDBOX_MODE_ENABLED }}/1/g' > dist/ecs-deploy-$$env.yml; \
	done
	cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/veit07/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-internal-dev.yml
	cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/int/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-internal-qa.yml
	cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/int/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-int.yml
	cat ecs-proxies-deploy.yml | sed -e 's/{{ SPINE_ENV }}/ref/g' -e 's/{{ SANDBOX_MODE_ENABLED }}/0/g' > dist/ecs-deploy-ref.yml
	cp ecs-proxies-deploy-prod.yml dist/ecs-deploy-prod.yml

release-epsat:
	mkdir -p dist
	cp ecs-proxies-deploy.yml dist/ecs-deploy-all.yml
	for env in internal-dev prod; do \
		cp ecs-proxies-deploy.yml dist/ecs-deploy-$$env.yml; \
	done
	cp ecs-proxies-deploy-internal-dev-sandbox.yml dist/ecs-deploy-internal-dev-sandbox.yml
	cp ecs-proxies-deploy-internal-qa.yml dist/ecs-deploy-internal-qa.yml
	cp ecs-proxies-deploy-int.yml dist/ecs-deploy-int.yml
	cp ecs-proxies-deploy-sandbox.yml dist/ecs-deploy-sandbox.yml
	cp packages/tool/specification/eps-api-tool.json dist/
	cp -Rv packages/tool/proxies dist
	rsync -av --progress packages/tool/e2e-tests dist --exclude e2e-tests/node_modules

prepare-for-api-release:
	cp api.ecs-proxies-containers.yml ecs-proxies-containers.yml
	cp api.ecs-proxies-deploy-prod.yml ecs-proxies-deploy-prod.yml
	cp api.ecs-proxies-deploy.yml ecs-proxies-deploy.yml
	touch api.release

prepare-for-epsat-release:
	cp epsat.ecs-proxies-containers.yml ecs-proxies-containers.yml
	cp epsat.ecs-proxies-deploy-int.yml ecs-proxies-deploy-int.yml
	cp epsat.ecs-proxies-deploy-internal-dev-sandbox.yml ecs-proxies-deploy-internal-dev-sandbox.yml
	cp epsat.ecs-proxies-deploy-internal-qa.yml ecs-proxies-deploy-internal-qa.yml
	cp epsat.ecs-proxies-deploy-sandbox.yml ecs-proxies-deploy-sandbox.yml
	cp epsat.ecs-proxies-deploy.yml ecs-proxies-deploy.yml
	cp -r examples packages/tool/site/client/static/
	cp -fr packages/models packages/tool/site/client/src/
	touch epsat.release


clean:
	rm -rf dist
	rm -rf examples/build
	rm -rf packages/models/dist
	rm -rf packages/specification/dist
	rm -rf packages/specification/build
	rm -rf packages/coordinator/dist
	rm -f packages/e2e-tests/postman/electronic-prescription-coordinator-postman-tests.json
	rm -f packages/e2e-tests/postman/collections/electronic-prescription-service-collection.json

## Run

run-specification:
	scripts/set_spec_server_dev.sh
	npm run --prefix=packages/specification/ serve

run-coordinator:
	source ./scripts/set_env_vars.sh && cd packages/coordinator/dist && npm run start

run-validator:
	cd ../ && \
	make -C validator run


## Install
install-validator:
	cd ../ && \
	make -C validator install

install-python:
	poetry install

install-node:
	cd packages/specification && npm ci
	cd packages/models && npm ci
	cd packages/coordinator && npm ci
	cd packages/e2e-tests && make install

install-hooks:
	python3 -m venv venv
	source ./venv/bin/activate \
	&& pip install pre-commit \
	&& pre-commit install --install-hooks --overwrite

install-epsat:
	cd packages/tool/site/client && npm ci
	cd packages/tool/site/server && npm ci
	cd packages/tool/e2e-tests && npm ci

## Build

build-specification:
	make --directory=packages/specification build 

build-coordinator:
	npm run --prefix=packages/coordinator/ build
	cp packages/coordinator/package.json packages/coordinator/dist/
	mkdir -p packages/coordinator/dist/coordinator/src/resources
	npm run --prefix=packages/coordinator/ copy-resources
	cp ../validator/manifest.json packages/coordinator/dist/coordinator/src/resources/validator_manifest.json 2>/dev/null || :

build-validator:
	cd ../ && \
	make -C validator build

build-proxies:
	mkdir -p dist/proxies/sandbox
	mkdir -p dist/proxies/live
	cp -Rv proxies/sandbox/apiproxy dist/proxies/sandbox
	cp -Rv proxies/live/apiproxy dist/proxies/live

## Test

test-coordinator:
	cd packages/coordinator \
	&& npm run test

## Quality Checks

lint-api: build
	cd packages/specification && npm run lint
	cd packages/coordinator && npm run lint
	poetry run flake8 scripts/*.py --config .flake8
	shellcheck scripts/*.sh
	cd packages/e2e-tests && make lint

lint-epsat:
	cd packages/tool/site/client && npm run lint
	cd packages/tool/site/server && npm run lint
	cd packages/tool/e2e-tests && npm run lint

check-licenses-api:
	cd packages/specification && npm run check-licenses
	cd packages/coordinator && npm run check-licenses
	cd packages/e2e-tests && make check-licenses
	scripts/check_python_licenses.sh

check-licenses-epsat:
	cd packages/tool/site/client && npm run check-licenses
	cd packages/tool/site/server && npm run check-licenses
	cd packages/tool/e2e-tests && npm run check-licenses

generate-mock-certs:
	cd packages/coordinator/tests/resources/certificates && bash ./generate_mock_certs.sh

## Tools

# Variables

ifdef pr
pr-prefix = -pr-
endif

ifneq (,$(findstring sandbox,$(env)))
pact-provider = nhsd-apim-eps-sandbox
else
pact-provider = nhsd-apim-eps
endif

export SERVICE_BASE_PATH=electronic-prescriptions$(pr-prefix)$(pr)
export PACT_PROVIDER=$(pact-provider)
export APIGEE_ENVIRONMENT=$(env)
export APIGEE_ACCESS_TOKEN=$(token)

space := $(subst ,, )
export PACT_VERSION = $(subst $(space),,$(USERNAME))
export PACT_PROVIDER_URL=https://$(env).api.service.nhs.uk/$(SERVICE_BASE_PATH)
export PACT_TAG=$(env)

# Example:
# make env=internal-dev-sandbox update-prescriptions
# make env=internal-dev-sandbox pr=333 update-prescriptions
update-prescriptions:
	cd scripts && poetry run python update_prescriptions.py https://$(env).api.service.nhs.uk/electronic-prescriptions$(pr-prefix)$(pr)

# Example:
# make install-smoke-tests
install-smoke-tests:
	cd packages/e2e-tests && make install

# Example:
# make mode=sandbox create-smoke-tests
# make mode=live create-smoke-tests
# make mode=sandbox update=false create-smoke-tests
# make mode=live update=false create-smoke-tests
create-smoke-tests:
	source .envrc \
	&& cd packages/e2e-tests \
	&& make create-pacts \
	&& make publish-pacts

# Example:
# make env=internal-dev-sandbox pr=333 run-smoke-tests
# make env=internal-dev pr=333 token=qvgsB5OR0QUKppg2pGbDagVMrj65 run-smoke-tests
run-smoke-tests:
	source .envrc \
	&& cd packages/e2e-tests \
	&& make verify-pacts

# Example:
# make generate-postman-collection
generate-postman-collection:
	# requires: make mode=live create-smoke-tests
	mkdir -p packages/e2e-tests/postman/collections
	cd packages/e2e-tests \
	&& npm run generate-postman-collection

create-int-release-notes:
	poetry run python ./scripts/identify_external_release_changes.py --release-to=INT --deploy-tag=${DEPLOY_TAG}

create-prod-release-notes:
	poetry run python ./scripts/identify_external_release_changes.py --release-to=PROD --deploy-tag=${DEPLOY_TAG}

npm-audit-fix:
    # || true is used to prevent errors from stopping the execution, e.g. vulnerabilities that npm cannot address
	cd packages/coordinator && npm audit fix || true
	cd packages/e2e-tests && npm audit fix || true
	cd packages/models && npm audit fix || true
	cd packages/specification && npm audit fix || true
	cd packages/tool/site/client && npm audit fix || true
	cd packages/tool/site/server && npm audit fix || true
	cd packages/tool/e2e-tests && npm audit fix || true
