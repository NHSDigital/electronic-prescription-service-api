#!/bin/sh

set -o pipefail

cd $HOME
bundle exec bin/pact publish /pact/pacts --consumer-app-version $BUILD_VERSION
