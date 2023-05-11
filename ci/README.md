# NRLF-CI

# Overview

This repository is responsible for setting up CI infrastructure for the NRLF project.
CI uses [self hosted github runners](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners) with [OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) to allow github actions to assume AWS role.

# Setup

## Prerequisites

- poetry
- python 3.9 or pyenv
- terraform 1.0.0 or tfenv
- jq
- packer

## Install python dependencies

```
poetry install
```

## Project CLI and AWS login

These instructions assume that you have enabled the project CLI:

```
poetry shell
source nrlf.sh
pre-commit install
```

Furthermore, prior to running `nrlf aws login` any time you need to ensure that you've logged out of any previous sessions:

```
nrlf aws reset-creds
```

# Github OpenID Thumbprint

To get the latest github open id thumbprint, simply run `get_oidc_thumbprint.sh` script

# Generating github runner ec2 ami

Packer is used to generate the Amazon Machine Image (ami) of the self hosted github runner

## 1. Make your changes

Add any changes to the runner setup to the packer directory see [packer docs](https://developer.hashicorp.com/packer/docs)

## 2. Setup the virtual environment

The project uses Python, so we need to get the virtual environment running and then re-mount the `nrlf.sh` script.

```shell
poetry shell
source nrlf.sh
```

## 3. Login to aws

Log on as mgmt-admin

```shell
nrlf aws login mgmt-admin <mfa_token>
```

## 4. Build ami

```shell
nrlf make build
```

This will create a temporary ec2 instance on mgmt account and run all the packer setup scripts. Wait for the process to finish. This should take around 20 minutes.

## 5. Copy the ami id

When packer finishes building the ami, make a note of the ami id to be used when deploying the infrastructure.

# Deploying CI infrastructure

## 1. Make terraform changes

Make all your changes to terraform. If you've rebuilt the ami, you will need to update the `github_runner_ami` in `terraform/etc/mgmt.tfvars` file.

## 2. Setup the virtual environment

The project uses Python, so we need to get the virtual environment running and then re-mount the `nrlf.sh` script.

```
poetry shell
source nrlf.sh
```

## 3. Login to AWS

In order to deploy the NRLF you will need to be able to login to the AWS account using MFA.

```
nrlf aws login mgmt-admin <mfa code>
```

## 4. Deploy the NRLF-CI

The NRLF-CI is deployed using terraform, it is deployed to the mgmt account

```
nrlf terraform plan
```

```
nrlf terraform apply
```

## 5. Reload github runners (ami change only)

If you have updated the github runner ami, you will need to reload the github runners so they run on the updated ami.

First you will need to clear all registered github runners

```shell
nrlf clear_runners
```

Log on to AWS web console and terminate all github runner instances. The autoscaling group will recreate new runner instances after existing instances are terminated.

### NOTE: Github personal access token for runner registration

Github requires a different registration token every time you want to register a new github runner. This means we have to call the github api to request a new registration token when the runner instances boots up.

This means we have to store a github personal access token in secrets manager. However, currently there is no way to create an access token that belongs to a repository, therefore, we currently use access token of a member of the NRLF repo. It would be good if we can create a service account only used for token generation etc.

# Tear down

To destroy all github CI infrastructure, use the following command

```
nrlf terraform destroy
```
