SHELL=/bin/bash -euo pipefail

.PHONY: install build test publish release clean

install:
	npm ci

clean:
	rm -rf dist/

build:
	mkdir -p dist
	npm run resolve
	poetry run python ../../scripts/yaml2json.py dist/electronic-prescription-service-api.resolved.yaml ./dist
	cat dist/electronic-prescription-service-api.resolved.json | poetry run python ../../scripts/set_version.py > dist/electronic-prescription-service-api.json
	ls -la dist

speccy-build:
	npm run speccy-lint
	mkdir -p speccy
	npm run speccy-resolve
	poetry run python ../../scripts/yaml2json.py speccy/electronic-prescription-service-api.resolved.yaml ./speccy
	cat speccy/electronic-prescription-service-api.resolved.json | poetry run python ../../scripts/set_version.py > speccy/electronic-prescription-service-api.json
	ls -la speccy

swagger-build:
	npm run swagger-lint
	mkdir -p swagger
	npm run swagger-resolve
	poetry run python ../../scripts/yaml2json.py swagger/electronic-prescription-service-api.resolved.yaml ./swagger
	cat swagger/electronic-prescription-service-api.resolved.json | poetry run python ../../scripts/set_version.py > swagger/electronic-prescription-service-api.json
	ls -la swagger

start-swagger-editor:
	docker-compose up -d

stop-swagger-editor:
	docker-compose down
