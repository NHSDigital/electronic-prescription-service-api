SHELL=/bin/bash -euo pipefail

lint:
	npm install
	npm run lint

clean:
	docker-compose down
	rm templates static -rf

build:
	docker-compose build

run:
	docker-compose up
