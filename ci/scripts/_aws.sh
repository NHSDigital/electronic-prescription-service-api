#!/bin/bash

function _aws_help() {
    echo
    echo "prescriptions aws <command> [options]"
    echo
    echo "commands:"
    echo "  help                        - this help screen"
    echo "  login <alias> [<mfa-token>] - "
    echo "  reset-creds                 - "
    echo
}

function _aws() {
    local command=$1

    case $command in
        "login") _aws_login "${@:2}" ;;
        "reset-creds") _aws_reset_creds "${@:2}" ;;
        *) _aws_help ;;
    esac
}

function _aws_login() {
    local profile_name=${PROFILE_PREFIX}-$1
    if [[ -z ${profile_name} ]]; then
        echo "Profile name is required." >&2
        return 1
    fi

    local token_code=$2
    if [[ -z $token_code ]]; then
        echo "MFA token code:"
        read -r -s token_code
    fi

    local caller_identity_json="$(aws sts get-caller-identity)"
    if ! [ "${?}" -eq 0 ]; then
        echo "No AWS credentials found" >&2
        return 1
    fi

    local current_aws_account_id="$(echo ${caller_identity_json} | jq -r .Account)" || return 1
    local current_principal_arn="$(echo ${caller_identity_json} | jq -r .Arn)" || return 1
    local current_user="$(echo ${current_principal_arn} | cut -d'/' -f 2)" || return 1
    local mfa_serial="arn:aws:iam::${current_aws_account_id}:mfa/${current_user}" || return 1
    local session_name="${profile_name}-${current_user}" || return 1

    local aws_account_id=$(_get_aws_info "${profile_name}" aws_account_id) || return 1
    local role_name=$(_get_aws_info "${profile_name}" role_name) || return 1
    local duration_seconds=$(_get_aws_info "${profile_name}" duration_seconds) || return 1
    local region=$(_get_aws_info "${profile_name}" region) || return 1
    local role_arn="arn:aws:iam::${aws_account_id}:role/${role_name}" || return 1

    local session_token_json="$(aws sts assume-role \
        --role-arn "${role_arn}" \
        --role-session-name "${session_name}" \
        --region "${region}" \
        --duration-seconds "${duration_seconds}" \
        --serial-number "${mfa_serial}" \
        --token-code "${token_code}" \
        --query Credentials; )" || return 1

    export AWS_ACCESS_KEY_ID="$(echo $session_token_json | jq -r .AccessKeyId)" || return 1
    export AWS_SECRET_ACCESS_KEY="$(echo $session_token_json | jq -r .SecretAccessKey)" || return 1
    export AWS_SESSION_TOKEN="$(echo $session_token_json | jq -r .SessionToken)" || return 1
    export AWS_SESSION_EXPIRY="$(echo $session_token_json | jq -r .Expiration)" || return 1

    if [[ \
        -n "${AWS_ACCESS_KEY_ID}"     \
        && -n "${AWS_SECRET_ACCESS_KEY}" \
        && -n "${AWS_SESSION_TOKEN}"     \
    ]]; then
        export AWS_ROLE="$(echo ${role_arn} | cut -d'/' -f 2)" || return 1
        export AWS_ROLE_ARN="${role_arn}" || return 1
        export AWS_ACCOUNT_ID="$(echo ${role_arn} | cut -d':' -f 5)" || return 1

        echo "Successfully assumed the role with ARN ${role_arn}."
        echo "Access keys valid until ${AWS_SESSION_EXPIRY}."

        return 0
    fi

    return 1
}

function _aws_reset_creds() {
    echo "Clearing AWS credential environment variables.  Now back to your defaults:"
    echo

    export AWS_ACCESS_KEY_ID=""
    export AWS_SECRET_ACCESS_KEY=""
    export AWS_SESSION_TOKEN=""
    export AWS_SESSION_EXPIRY=""
    export account_name=""
}

function _get_aws_info() {
    local profile_name=$1
    local key=$2
    python -c "import os; from configparser import ConfigParser; parser = ConfigParser(); parser.read(os.environ['HOME'] + '/.aws/config'); print(parser['profile ${profile_name}']['${key}'])"
    return $?
}
