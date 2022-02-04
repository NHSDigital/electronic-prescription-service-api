SHELL=/bin/bash -euo pipefail

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
	mkdir -p dist/e2e-tests
	rsync -av --progress --exclude e2e-tests/node_modules dist/e2e-tests

test:
	cd site/client && npm run test

clean:
	docker-compose down
	rm templates static -rf

build:
	docker-compose build

run:
	docker-compose up
