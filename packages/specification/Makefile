SHELL=/bin/bash -euo pipefail

.PHONY: install build test publish release clean

install:
	npm ci

clean:
	rm -rf build/
	rm -rf dist/

build:
	mkdir -p build/components/examples
	mkdir -p build/components/schemas
	cp ../../examples/signature.json build/components/examples/.
	cp -r ../../examples/spec-errors/. build/components/examples/.
	cp -r ../../examples/. build/components/examples/.
	cp -r ./schemas/. build/components/schemas/.
	cp electronic-prescription-service-api.yaml build/electronic-prescription-service-api.yaml
	npm run resolve
	poetry run python ../../scripts/yaml2json.py build/electronic-prescription-service-api.resolved.yaml build/
	cat build/electronic-prescription-service-api.resolved.json | poetry run python ../../scripts/set_version.py > build/electronic-prescription-service-api.json
	mkdir -p dist
	cp build/electronic-prescription-service-api.json dist/electronic-prescription-service-api.json
	ls -la build/components/schemas/MedicationRequest/extensions
