SHELL=/bin/bash -euo pipefail

install:
	npm ci
	poetry install

lint:
	cd site/client && npm ci && npm run lint
	cd site/server && npm ci && npm run lint
	cd e2e-tests && npm ci && npm run lint

publish:
	echo Publish

release:
	mkdir -p dist
	cp ecs-proxies-deploy.yml dist/ecs-deploy-all.yml
	for env in internal-dev prod; do \
		cp ecs-proxies-deploy.yml dist/ecs-deploy-$$env.yml; \
	done
	cp ecs-proxies-deploy-internal-dev-sandbox.yml dist/ecs-deploy-internal-dev-sandbox.yml
	cp ecs-proxies-deploy-internal-qa.yml dist/ecs-deploy-internal-qa.yml
	cp ecs-proxies-deploy-int.yml dist/ecs-deploy-int.yml
	cp ecs-proxies-deploy-sandbox.yml dist/ecs-deploy-sandbox.yml
	cp specification/eps-api-tool.json dist/
	cp -Rv proxies dist
	rsync -av --progress e2e-tests dist --exclude e2e-tests/node_modules

test: install check-licenses
	cd site/client && npm run test

check-licenses:
	cd site/client && npm run check-licenses
	cd site/server && npm run check-licenses
	cd e2e-tests && npm run check-licenses
	scripts/check_python_licenses.sh

clean:
	docker-compose down
	rm templates static -rf

build:
	docker-compose build

run:
	docker-compose up
