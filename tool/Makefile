SHELL=/bin/bash -euo pipefail

lint:
	echo Lint
# todo: lint project?
#cd site/client && npm install && npm run lint
#cd site/server_javascript && npm install && npm run lint

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

clean:
	docker-compose down
	rm templates static -rf

build:
	docker-compose build

run:
	docker-compose up
