#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR="${SCRIPT_DIR}/.."

TOOL_VERSION_FILE='.tool-versions'
API_DOCKER_FILE='packages/coordinator/Dockerfile'
API_BUILD_PIPELINE_FILE='azure/azure-build-pipeline.yml'
API_RELEASE_PIPELINE_FILE='azure/templates/run_tests.yml'
EPSAT_DOCKER_FILE='packages/tool/site/Dockerfile'
EPSAT_BUILD_PIPELINE_FILE='packages/tool/azure/azure-build-pipeline.yml'
EPSAT_RELEASE_PIPELINE_FILE='packages/tool/azure/azure-release-template.yml'
DEVCONTAINER_DOCKERFILE='.devcontainer/Dockerfile'


TOOL_VERSIONS_NODE_VERSION=$(grep nodejs "${ROOT_DIR}/${TOOL_VERSION_FILE}" | awk '{ print $NF }')
API_DOCKER_NODE_BASE_VERSION=$(grep "FROM node.* AS base" "${ROOT_DIR}/${API_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)
API_DOCKER_NODE_BUILD_VERSION=$(grep "FROM node.* AS build" "${ROOT_DIR}/${API_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)
EPSAT_DOCKER_NODE_BASE_VERSION=$(grep "FROM node.* AS base" "${ROOT_DIR}/${EPSAT_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)
EPSAT_DOCKER_NODE_BUILD_CLIENT_VERSION=$(grep "FROM node.* AS build-client" "${ROOT_DIR}/${EPSAT_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)
EPSAT_DOCKER_NODE_BUILD_SERVER_VERSION=$(grep "FROM node.* AS build-server" "${ROOT_DIR}/${EPSAT_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)
API_BUILD_PIPELINE_NODE_VERSION=$(awk '/NodeTool@0/{x=NR+3;next}(NR==x){print}' "${ROOT_DIR}/${API_BUILD_PIPELINE_FILE}" | awk '{ print $NF }'  | tr -d '"')
API_RELEASE_PIPELINE_NODE_VERSION=$(awk '/NodeTool@0/{x=NR+3;next}(NR==x){print}' "${ROOT_DIR}/${API_RELEASE_PIPELINE_FILE}" | awk '{ print $NF }'  | tr -d '"')
EPSAT_BUILD_PIPELINE_NODE_VERSION=$(awk '/NodeTool@0/{x=NR+3;next}(NR==x){print}' "${ROOT_DIR}/${EPSAT_BUILD_PIPELINE_FILE}" | awk '{ print $NF }'  | tr -d '"')
EPSAT_RELEASE_PIPELINE_NODE_VERSION=$(awk '/NodeTool@0/{x=NR+3;next}(NR==x){print}' "${ROOT_DIR}/${EPSAT_RELEASE_PIPELINE_FILE}" | awk '{ print $NF }'  | tr -d '"')

DEVCONTAINER_VALIDATOR_VERSION=$(grep "ARG VALIDATOR_VERSION_TAG" "${ROOT_DIR}/${DEVCONTAINER_DOCKERFILE}" |cut -d = -f 2)
API_BUILD_PIPELINE_VALIDATOR_VERSION=$(awk '/validation-service-fhir-r4/{x=NR+3;next}(NR==x){print}' "${ROOT_DIR}/${API_BUILD_PIPELINE_FILE}" | awk '{ print $NF }')
EPSAT_VALIDATOR_VERSION=$(grep VALIDATOR_VERSION= "${ROOT_DIR}/${EPSAT_BUILD_PIPELINE_FILE}" |cut -d = -f 2)

FAILED_CHECK=0

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$API_DOCKER_NODE_BASE_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${API_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$API_DOCKER_NODE_BUILD_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${API_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$EPSAT_DOCKER_NODE_BASE_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${EPSAT_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$EPSAT_DOCKER_NODE_BUILD_CLIENT_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${EPSAT_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$EPSAT_DOCKER_NODE_BUILD_SERVER_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${EPSAT_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$API_BUILD_PIPELINE_NODE_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${API_BUILD_PIPELINE_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$API_RELEASE_PIPELINE_NODE_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${API_RELEASE_PIPELINE_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$EPSAT_BUILD_PIPELINE_NODE_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${EPSAT_BUILD_PIPELINE_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$TOOL_VERSIONS_NODE_VERSION" != "$EPSAT_RELEASE_PIPELINE_NODE_VERSION" ]]; then
    echo "node version in ${TOOL_VERSION_FILE} and ${EPSAT_RELEASE_PIPELINE_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$DEVCONTAINER_VALIDATOR_VERSION" != "$API_BUILD_PIPELINE_VALIDATOR_VERSION" ]]; then
    echo "validator version in ${DEVCONTAINER_DOCKERFILE} and ${API_BUILD_PIPELINE_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ "$DEVCONTAINER_VALIDATOR_VERSION" != "$EPSAT_VALIDATOR_VERSION" ]]; then
    echo "validator version in ${DEVCONTAINER_DOCKERFILE} and ${EPSAT_BUILD_PIPELINE_FILE} do not match"
    FAILED_CHECK=1
fi

if [[ ${FAILED_CHECK} == 1 ]]; then
    echo "Failed validation"
    echo "TOOL_VERSIONS_NODE_VERSION: ${TOOL_VERSIONS_NODE_VERSION}"
    echo "API_DOCKER_NODE_BASE_VERSION: ${API_DOCKER_NODE_BASE_VERSION}"
    echo "API_DOCKER_NODE_BUILD_VERSION ${API_DOCKER_NODE_BUILD_VERSION}"
    echo "EPSAT_DOCKER_NODE_BASE_VERSION: ${EPSAT_DOCKER_NODE_BASE_VERSION}"
    echo "EPSAT_DOCKER_NODE_BUILD_CLIENT_VERSION: ${EPSAT_DOCKER_NODE_BUILD_CLIENT_VERSION}"
    echo "EPSAT_DOCKER_NODE_BUILD_SERVER_VERSION: ${EPSAT_DOCKER_NODE_BUILD_SERVER_VERSION}"
    echo "API_BUILD_PIPELINE_NODE_VERSION: ${API_BUILD_PIPELINE_NODE_VERSION}"
    echo "API_RELEASE_PIPELINE_NODE_VERSION: ${API_RELEASE_PIPELINE_NODE_VERSION}"
    echo "EPSAT_BUILD_PIPELINE_NODE_VERSION: ${EPSAT_BUILD_PIPELINE_NODE_VERSION}"
    echo "EPSAT_RELEASE_PIPELINE_NODE_VERSION: ${EPSAT_RELEASE_PIPELINE_NODE_VERSION}"
    echo "DEVCONTAINER_VALIDATOR_VERSION: ${DEVCONTAINER_VALIDATOR_VERSION}"
    echo "API_BUILD_PIPELINE_VALIDATOR_VERSION: ${API_BUILD_PIPELINE_VALIDATOR_VERSION}"

    exit 1
fi
