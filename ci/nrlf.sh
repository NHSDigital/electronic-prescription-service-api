#!/bin/bash

export PIPENV_VENV_IN_PROJECT=1
root=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)

for script_file in "$root"/scripts/*.sh; do
  source $script_file
done

function _nrlf_commands_help() {
  echo
  echo "nrlf <command> [options]"
  echo
  echo "commands:"
  echo "  help          - this help screen"
  echo "  make          - calls the make/build routines"
  echo "  aws           - aws commands"
  echo "  terraform     - terraform commands"
  echo "  clear_runners - delete all existing github runners on github repo"
  echo
}

function nrlf() {
  local current=$(pwd)
  local command=$1

  cd $root

  case $command in
    "aws") _aws "${@:2}" ;;
    "make") _make "${@:2}" ;;
    "terraform") _terraform "${@:2}" ;;
    "clear_runners") python ./scripts/clear_runners.py ;;
    *) _nrlf_commands_help ;;
  esac

  cd $current
}

echo "Usage: nrlf"
