#!/bin/bash


function _terraform_help() {
    echo
    echo "nrlf terraform <command> [options]"
    echo
    echo "commands:"
    echo "  help          - this help screen"
    echo "  validate      - runs 'terraform validate'"
    echo "  fmt           - runs 'terraform fmt'"
    echo "  init          - runs 'terraform init'"
    echo "  plan          - runs 'terraform plan'"
    echo "  apply         - runs 'terraform apply'"
    echo "  destroy       - runs 'terraform destroy'"
    echo
}

function _terraform() {
  local command=$1
  local env
  local var_file
  env="mgmt"
  var_file="./etc/mgmt.tfvars"
  plan_file="./tfplan"
  local terraform_dir="$root/terraform"

  case $command in
    #----------------
    "validate")
      cd $terraform_dir
      terraform validate "${@:2}" || return 1
    ;;
    #----------------
    "fmt")
      cd $terraform_dir
      terraform fmt "${@:2}" || return 1
    ;;
    #----------------
    "init")
      if [[ "$(aws sts get-caller-identity)" != *mgmt* ]];
      then
          echo "Please log in as the mgmt account" >&2
          return 1
      fi

      cd $terraform_dir
      terraform init "${@:2}" || return 1
      terraform workspace select "$env" || terraform workspace new "$env" || return 1
    ;;
    #----------------
    "plan")
      if [[ "$(aws sts get-caller-identity)" != *mgmt* ]];
      then
          echo "Please log in as the mgmt account" >&2
          return 1
      fi

      cd $terraform_dir
      terraform init || return 1
      terraform workspace select "$env" || terraform workspace new "$env" || return 1
      terraform plan -var-file="$var_file" -out="$plan_file" "${@:2}" || return 1
    ;;
    #----------------
    "apply")
      if [[ "$(aws sts get-caller-identity)" != *mgmt* ]];
      then
          echo "Please log in as the mgmt account" >&2
          return 1
      fi

      cd $terraform_dir
      terraform workspace select "$env" || terraform workspace new "$env" || return 1
      terraform apply "$plan_file" "${@:2}" || return 1
    ;;
    #----------------
    "destroy")
      if [[ "$(aws sts get-caller-identity)" != *mgmt* ]];
      then
          echo "Please log in as the mgmt account" >&2
          return 1
      fi

      cd $terraform_dir
      terraform workspace select "$env" || terraform workspace new "$env" || return 1
      terraform destroy -var-file="$var_file" "${@:2}" || return 1
      if [ "$env" != "default" ];
      then
        terraform workspace select default || return 1
        terraform workspace delete "$env" || return 1
      fi
    ;;

    *) _terraform_help ;;
  esac
}
