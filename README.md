# Electronic Prescription Service API
![Build](https://github.com/NHSDigital/electronic-prescription-service-api/workflows/Build/badge.svg?branch=master)

This is a RESTful HL7® FHIR® API specification for the _Electronic Prescription Service API_.

- `azure/` Defines CI/CD pipeline for the API.
- `packages/coordinator/` Deals with message translation and distribution to other services. Backend for the production EPS FHIR API.
- `packages/models/` A common project for sharing models and loading example requests and responses for testing
- `packages/specification/` This [Open API Specification](https://swagger.io/docs/specification/about/) describes the endpoints, methods and messages exchanged by the API. Use it to generate interactive documentation; the contract between the API and its consumers.
- `packages/tool/` EPSAT tool.
- `packages/tool/azure` Defines CI/CD pipeline for EPSAT.
- `packages/tool/e2e-tests` End to end tests for EPSAT.
- `packages/tool/proxies` Apigee API Proxies for EPSAT.
- `packages/tool/scripts` Useful scripts.
- `packages/tool/site` Code for EPSAT - split into client and server.
- `packages/tool/specification` API spec for EPSAT - needed for Apigee deployment.
- `proxies/` Apigee API Proxies for the API
- `scripts/` Utilities helpful to developers of this specification.

Consumers of the API will find developer documentation on the [NHS Digital Developer Hub](https://digital.nhs.uk/developer/api-catalogue).

## Contributing

Contributions to this project are welcome from anyone, providing that they conform to the [guidelines for contribution](https://github.com/NHSDigital/electronic-prescription-service-api/blob/master/CONTRIBUTING.md) and the [community code of conduct](https://github.com/NHSDigital/electronic-prescription-service-api/blob/master/CODE_OF_CONDUCT.md).

### Licensing

This code is dual licensed under the MIT license and the OGL (Open Government License). Any new work added to this repository must conform to the conditions of these licenses. In particular this means that this project may not depend on GPL-licensed or AGPL-licensed libraries, as these would violate the terms of those libraries' licenses.

The contents of this repository are protected by Crown Copyright (C).

## Development

It is recommended that you use visual studio code and a devcontainer as this will install all necessary components and correct versions of tools and languages.  
See https://code.visualstudio.com/docs/devcontainers/containers for details on how to set this up on your host machine.  
There is also a workspace file in .vscode that should be opened once you have started the devcontainer. The workspace file can also be opened outside of a devcontainer if you wish.

<details>
<summary>Manual Setup</summary>

If you decide not to use devcontainers, the following dependencies need to be installed: make, jq, curl, asdf.  
If you want to run validator, you must install maven and a jre

#### On Ubuntu 20.04

Installed by running the following commands:

```
sudo apt update
sudo apt install git make curl build-essential checkinstall libssl-dev -y
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.11.2
echo '. $HOME/.asdf/asdf.sh' >> ~/.bashrc; \
echo '. $HOME/.asdf/completions/asdf.bash' >> ~/.bashrc;
source ~/.bashrc

# for validator
sudo apt install default-jre maven -y

```

#### On Mac

```
xcode-select --install       # if not already installed
brew update
brew install git     # if not already installed

# INSTALL PYTHON with asdf
brew install asdf
# then follow instructions to update ~/.zshrc and restart terminal
brew install openssl readline sqlite3 xz zlib tcl-tk     # python dependencies

# INSTALL USEFUL THINGS
brew install jq

```

### asdf setup

You need to run the following to install the needed asdf packages

```
asdf plugin add python
asdf plugin add poetry https://github.com/asdf-community/asdf-poetry.git
asdf plugin add shellcheck https://github.com/luizm/asdf-shellcheck.git
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf install
```

### Install packages

Install the packages with `make install`, then verify everything is installed correctly by running the default `make` target.

</details>

### Pre-commit hooks

Some pre-commit hooks are installed as part of the install above to ensure you can't commit invalid spec changes by accident and to run basic lint checks.  
The pre-commit hook uses python package pre-commit and is configured in the file .pre-commit-config.yaml.  
A combination of these checks are also run in CI.

### Environment Variables

Various scripts and commands rely on environment variables being set. These are documented with the commands.

:bulb: Consider using [direnv](https://direnv.net/) to manage your environment variables during development and maintaining your own `.envrc` file - the values of these variables will be specific to you and/or sensitive.

The following are recommended to place in the .envrc file

```
export PACT_PROVIDER=nhsd-apim-eps
export PACT_BROKER_BASIC_AUTH_PASSWORD=<SECRET>
export PACT_BROKER_BASIC_AUTH_USERNAME=<SECRET>
export PACT_BROKER_URL=https://nhsd-pact-broker.herokuapp.com
# for api
#export SERVICE_BASE_PATH=electronic-prescriptions
# for epsat
export SERVICE_BASE_PATH=eps-api-tool
export PACT_VERSION="$SERVICE_BASE_PATH"
export APIGEE_ACCESS_TOKEN=$(npm run --silent fetch-apigee-access-token)
export APIGEE_ENVIRONMENT=internal-dev
export PACT_PROVIDER_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/$SERVICE_BASE_PATH
export APIGEE_KEY=<SECRET>
export API_CLIENT_SECRET=<SECRET>
export API_CLIENT_ID=<SECRET>
export APIGEE_ENVIRONMENT=internal-dev
export JIRA_TOKEN=<SECRET>
export CONFLUENCE_TOKEN=<SECRET>
```

### Make commands

There are further `make` commands that are run as part of the CI pipeline and help alias some functionality during development.

#### API and EPSAT builds

To enable API and EPSAT to be built as part of the CI processes, the following targets are derived dynamically when the make command is invoked. The derived targets have either -api, -epsat or -all as a suffix
If there is a file called api.release in the root folder, then the targets are run for api.  
If there is a file called epsat.release in the root folder, then the targets are run for epsat.  
If neither file is present, then the targets are run for api and epsat

- test
- release
- install
- lint
- check-licenses
- build

#### Common commands

Common commands needed for development can be run by running the default `make` command.

```unix
make
```

This outputs to `build.log` and runs the following targets:

- `clean` -- Removes the output from the build and release commands
- `build` -- Outputs the FHIR R4 validated models and artifacts for the: specification, coordinator and apigee proxies into the corresponding `dist/` directories
- `test` -- Performs quality checks including linting, licence checking of dependencies and unit/low level integration tests
- `release` -- Pulls all the artifacts for the individual components together and arranges them in a format ready to deploy; used mainly by CI but useful to check the output matches expectations

#### Run targets

* `run-specification` -- Serves a preview of the specification in human-readable format
* `run-coordinator` -- Run the coordinator locally

All `run-*` make targets rely on the corresponding `build-*` make targets, the `build` make target will run all of these

#### Release targets

These are used by CI pipeline to get files into the correct location so the APIM provided build templates work.  
They can be safely run locally.  
This is not valid for -all target

### Prepare for release targets

These are called from CI pipeline for either API or EPSAT and copy some files to root folder needed for the APIM supplied pipeline templates to work.  
They also create a file called either api.release or epsat.release in the root folder.  
They can safely be run locally

### Clean and deep-clean targets

The clean target clears up any files that have been generated by building or testing locally.  
The deep-clean target runs clean and also removes any node_modules, python libraries, and certificates created locally.

#### Tool commands

- `generate-mock-certs` -- Creates some TLS certifacates that are used for local testing

- `update-prescriptions` -- Updates examples with newly generated prescription ids/short prescription ids and updates authored on fields, use this in combination with tools for signing the examples to test dispensing in integration environments

### Running tests

#### Unit and Integration tests

There are tests that can be run locally for the following

- packages/coordinator
- packages/models
- packages/toos/site/client

These can either be run from the root directory specifying the workspace - eg

```
npm test --workspace packages/coordinator
```

or by changing directory and running

```
npm test
```

or by using make targets

```
make test-coordinator
make test-models
make test-epsat
```

or if using the devcontainer from the testing sidebar.

#### End-to-end API tests

See [end to end API tests](./packages/e2e-tests/README.md) for more details

#### End-to-end EPSAT tests

See [end to end EPSAT tests](./packages/tool/e2e-tests/README.md) for more details

### Emacs Plugins

- [**openapi-yaml-mode**](https://github.com/esc-emacs/openapi-yaml-mode) provides syntax highlighting, completion, and path help

### Speccy

> [Speccy](http://speccy.io/) _A handy toolkit for OpenAPI, with a linter to enforce quality rules, documentation rendering, and resolution._

Speccy does the lifting for the following npm scripts:

- `lint` -- Lints the definition
- `resolve` -- Outputs the specification as a **single file**
- `serve` -- Serves a preview of the specification in human-readable format

(Workflow detailed in a [post](https://developerjack.com/blog/2018/maintaining-large-design-first-api-specs/) on the _developerjack_ blog.)

:bulb: The `resolve -i` command is useful when uploading to Apigee which requires the spec as a single file. The `-i` argument ensures that all `$ref`'s are replaced with the referenced file or internal object's content

### Caveats

#### Swagger UI

Swagger UI unfortunately doesn't correctly render `$ref`s in examples, so use `speccy serve` instead.

#### Apigee Portal

The Apigee portal will not automatically pull examples from schemas, you must specify them manually.

#### Platform setup

Successful deployment of the API Proxy requires:

- A _Target Server_ named `ig3`

:bulb: For Sandbox-running environments (`test`) these need to be present for successful deployment but can be set to empty/dummy values.

## Release notes

The project includes a script to calculate the difference between two different versions of the API and upload the details to a confluenc page. The script is available as a makefile command:

```

make create-int-release-notes
make create-prod-release-notes


By default, this will compare the currently deployed version on `internal-dev` and the deployed version on `int` and provide a summary of all changes. You can specify an arbitrary tag to deploy with the `DEPLOY_TAG` argument:

# Validator

The FHIR Validator is fetched during CI for a specific released tag. To see the released tag currently being used you can review the `Download Validator` step [version](azure/azure-build-pipeline.yml)

## Running the validator locally
You can also run the validator locally by cloning the repo in the parent folder of this checked out repo

You can also run the validator locally by cloning the repo in the parent folder of this checked out repo. The code is already cloned if you are using the devcontainer

```

$ cd ../
$ git clone --depth 1 --branch <version> https://github.com/NHSDigital/validation-service-fhir-r4.git validator
$ cd electronic-prescription-service-api
$ make install-validator
$ make build-validator
$ make run-validator

```

```

```
