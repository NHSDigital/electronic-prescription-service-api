#!/bin/bash

function _make_help() {
  echo
  echo "nrlf make <command> [options]"
  echo
  echo "commands:"
  echo "  help          - this help screen"
  echo "  install       - Setup local dependencies"
  echo "  build         - Build github runner ami"
}

function _make() {
  command=$1
  case $command in
    "install") _install ;;
    "build") _build ;;
    *) _make_help ;;
  esac
}

function _install() {
  pipenv install --dev || return 1
}

function _build() {
  pushd packer
  packer build template.json
  popd
}
