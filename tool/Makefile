SHELL=/bin/bash -euo pipefail

install:
	poetry install

lint:
	cd site/client && npm ci && npm run lint
	cd site/server && npm ci && npm run lint
	cd e2e-tests && npm ci && npm run lint

publish:
	echo Publish

release:
	mkdir -p dist/proxies/live
	cp ecs-proxies-deploy.yml dist/ecs-deploy-all.yml
	for env in internal-dev int prod; do \
		cp ecs-proxies-deploy.yml dist/ecs-deploy-$$env.yml; \
	done
	cp ecs-proxies-deploy-internal-qa.yml dist/ecs-deploy-internal-qa.yml
	cp specification/eps-api-tool.json dist/
	cp -Rv proxies/live/apiproxy dist/proxies/live
	rsync -av --progress e2e-tests dist --exclude e2e-tests/node_modules

test: install check-licenses
#cd site/client && npm run test

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
