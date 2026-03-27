#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR="${SCRIPT_DIR}/.."

API_DOCKER_FILE='packages/coordinator/Dockerfile'
EPSAT_DOCKER_FILE='packages/tool/site/Dockerfile'

LOCAL_NODE_VERSION=$(node -v | sed 's/^v//')
API_DOCKER_NODE_BASE_VERSION=$(grep "FROM node.* AS base" "${ROOT_DIR}/${API_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)
EPSAT_DOCKER_NODE_BASE_VERSION=$(grep "FROM node.* AS base" "${ROOT_DIR}/${EPSAT_DOCKER_FILE}" |cut -d : -f2 |cut -d- -f1)

FAILED_CHECK=0

if [[ "$LOCAL_NODE_VERSION" != "$API_DOCKER_NODE_BASE_VERSION" ]]; then
    echo "node version in local environment and ${API_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi


if [[ "$LOCAL_NODE_VERSION" != "$EPSAT_DOCKER_NODE_BASE_VERSION" ]]; then
    echo "node version in local environment and ${EPSAT_DOCKER_FILE} do not match"
    FAILED_CHECK=1
fi




if [[ ${FAILED_CHECK} == 1 ]]; then
    echo "Failed validation"
    echo "LOCAL_NODE_VERSION: ${LOCAL_NODE_VERSION}"
    echo "API_DOCKER_NODE_BASE_VERSION: ${API_DOCKER_NODE_BASE_VERSION}"
    echo "API_DOCKER_NODE_BUILD_VERSION ${API_DOCKER_NODE_BUILD_VERSION}"

    exit 1
fi
