#!/bin/bash
# shellcheck disable=SC2094

set -o nounset errexit pipefail

export PATH_TO_SPEC_FILE="${PATH_TO_SPEC_FILE:=specification/dist/electronic-prescription-service-api.json}"

cat <<< """$(jq 'del(.servers[])|.servers[.servers| length] |= . + {"url": "http://localhost:9000", "description": "Local Dev environment."}' $PATH_TO_SPEC_FILE)""" > $PATH_TO_SPEC_FILE