#!/usr/bin/env bash
set -e

CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "Script directory: $CURRENT_DIR"

mkdir -p .local_config
FIX_SCRIPT="${CURRENT_DIR}/../.github/scripts/fix_cdk_json.sh"
EPS_API_CONFIG=".local_config/eps_api_app.config.json"
EPS_API_LOG=".local_config/eps_api_app.log"

if [ -z "${PULL_REQUEST_ID}" ]; then
    echo "What is the pull request id? "
    read -r PULL_REQUEST_ID
else
    read -r -p "Getting exports for pull request id ${PULL_REQUEST_ID}. Is this correct? " yn
    case $yn in
        [Yy]* ) ;;
        [Nn]* ) exit;;
        * ) exit;;
    esac
fi

STACK_NAME=prescribe-dispense-pr-$PULL_REQUEST_ID

echo "Getting exports from stack ${STACK_NAME}"

CF_LONDON_EXPORTS=$(aws cloudformation list-exports --region eu-west-2 --output json)


# vars needed for cdk

COMMIT_ID=$(echo "$CF_LONDON_EXPORTS" | \
    jq \
    --arg EXPORT_NAME "${STACK_NAME}:local:COMMIT-ID" \
    -r '.Exports[] | select(.Name == $EXPORT_NAME) | .Value')
VERSION_NUMBER=$(echo "$CF_LONDON_EXPORTS" | \
    jq \
    --arg EXPORT_NAME "${STACK_NAME}:local:VERSION-NUMBER" \
    -r '.Exports[] | select(.Name == $EXPORT_NAME) | .Value')
LOG_RETENTION_IN_DAYS=30
LOG_LEVEL=debug
FORWARD_CSOC_LOGS=false
RUN_REGRESSION_TESTS=false


# export all the vars so they can be picked up by external programs

export STACK_NAME
export COMMIT_ID
export VERSION_NUMBER
export LOG_RETENTION_IN_DAYS
export LOG_LEVEL
export FORWARD_CSOC_LOGS
export RUN_REGRESSION_TESTS


echo "Generating config for ${EPS_API_CONFIG}"
"$FIX_SCRIPT" "$EPS_API_CONFIG"

echo "Installing dependencies locally"
mkdir -p .dependencies
poetry export --only create_prescription -o requirements_create_prescription
pip3 install -r requirements_create_prescription -t .dependencies/create_prescription/python


sync_eps_api_app() {
    echo "Starting sync eps_api CDK app"
    echo "Stateful CDK app log file at ${EPS_API_LOG}"
    CONFIG_FILE_NAME="${EPS_API_CONFIG}" npx cdk deploy \
        --app "npx ts-node --prefer-ts-exts packages/cdk/bin/PrescribeDispenseApp.ts" \
        --watch \
        --all \
        --ci true \
        --require-approval never \
        --output .local_config/eps_api_app.out/ \
        > $EPS_API_LOG 2>&1
}


(trap 'kill 0' SIGINT; sync_eps_api_app)
