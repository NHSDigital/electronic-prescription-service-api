#!/bin/bash

set -o pipefail

exitCode=0

publish() {
    docker-compose -f ./broker/docker-compose.yml up -d
    docker wait pact-cli
    exitCode=$(docker wait pact-cli)
    return $exitCode
}

for i in {1..3}; do publish && break || sleep 1; done

docker logs pact-cli
docker-compose -f ./broker/docker-compose.yml down

exit $exitCode
