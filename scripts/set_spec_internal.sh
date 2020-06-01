#!/bin/bash

set -o nounset errexit pipefail

export PATH_TO_SPEC_FILE="${PATH_TO_SPEC_FILE:=build/electronic-prescriptions.json}"

cat <<< $(jq 'del(.servers[])|.servers[.servers| length] |= . + {"url": "https://dev.api.service.nhs.uk/electronic-prescriptions", "description": "Internal Dev environment."}|.servers[.servers| length] |= . + {"url": "https://internal-qa.api.service.nhs.uk/electronic-prescriptions", "description": "Internal QA environment."}|.servers[.servers| length] |= . + {"url": "https://internal-qa-sandbox.api.service.nhs.uk/electronic-prescriptions", "description": "Internal QA Sandbox environment."}' $PATH_TO_SPEC_FILE) > $PATH_TO_SPEC_FILE