# Electronic Prescription Service API
![Build](https://github.com/NHSDigital/electronic-prescription-service-api/workflows/Build/badge.svg?branch=master)

This is a RESTful HL7® FHIR® API specification for the *Electronic Prescription Service API*.

* `azure/` Defines CI/CD pipeline.
* `packages/coordinator/` Deals with message translation and distribution to other services. Backend for the production EPS FHIR API.
* `packages/models/` A common project for sharing models and loading example requests and responses for testing
* `packages/specification/` This [Open API Specification](https://swagger.io/docs/specification/about/) describes the endpoints, methods and messages exchanged by the API. Use it to generate interactive documentation; the contract between the API and its consumers.
* `examples/` Contains example requests and responses used to test various components of this solution.
* `proxies/` Apigee API Proxies
* `scripts/` Utilities helpful to developers of this specification.
* `tests/` End-to-end testing of the EPS FHIR API.

Consumers of the API will find developer documentation on the [NHS Digital Developer Hub](https://digital.nhs.uk/developer/api-catalogue).

## Contributing
Contributions to this project are welcome from anyone, providing that they conform to the [guidelines for contribution](https://github.com/NHSDigital/electronic-prescription-service-api/blob/master/CONTRIBUTING.md) and the [community code of conduct](https://github.com/NHSDigital/electronic-prescription-service-api/blob/master/CODE_OF_CONDUCT.md).

### Licensing
This code is dual licensed under the MIT license and the OGL (Open Government License). Any new work added to this repository must conform to the conditions of these licenses. In particular this means that this project may not depend on GPL-licensed or AGPL-licensed libraries, as these would violate the terms of those libraries' licenses.

The contents of this repository are protected by Crown Copyright (C).

## Development
### Setup
The following dependencies need to be installed: make, jq, nodejs + npm/yarn, poetry, python3, shellcheck, curl, java

#### On Ubuntu 20.04
Installed by running the following commands:

```
& sudo apt update
$ sudo apt install git make curl npm python3-apt python3-distutils python3-venv default-jre shellcheck build-essential checkinstall libssl-dev maven -y
$ curl -sSL https://install.python-poetry.org | python3 -
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
$ nvm install v16.14
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
asdf plugin-add python      # python plugin
asdf list all python     # all the python versions available in asdf
asdf install python 3.8.15
asdf local python 3.8.15
# creates a .tool-versions in current directory that shouldn't be checked in
# OR `asdf global python 3.8.15` creates it in your $HOME
python -V
brew install poetry
poetry env use 3.8      # to make sure poetry is using correct version of Python

# INSTALL NODE with nvm
brew install nvm
mkdir ~/.nvm
# follow instructions to add PATH info to shell profile to ~/.zshrc and restart terminal
nvm install v16.14

# INSTALL USEFUL THINGS
brew install shellcheck jq

# INSTALL JAVA via SDKMan
# Install SDKMan from https://sdkman.io/install, including .zshrc update
curl -s "https://get.sdkman.io" | zsh
source "/Users/<mac-username>/.sdkman/bin/sdkman-init.sh"
sdk version
sdk list java
sdk install java 11.0.17-zulu
sdk default java 11.0.17-zulu     # make default
```

### Install packages
Install the packages with `make install`, then verify everything is installed correctly by running the default `make` target.

#### Pre-commit hooks
Some pre-commit hooks are installed as part of the install above to ensure you can't commit invalid spec changes by accident. A combination of these checks are also run in CI.

### Environment Variables
Various scripts and commands rely on environment variables being set. These are documented with the commands.

:bulb: Consider using [direnv](https://direnv.net/) to manage your environment variables during development and maintaining your own `.envrc` file - the values of these variables will be specific to you and/or sensitive.

### Make commands
There are further `make` commands that help alias some functionality during development.

#### Common commands
Common commands needed for development can be run by running the default `make` command.

```
$ make
```

This outputs to `build.log` and runs the following targets:

 * `clean` -- Removes the output from the build and release commands
 * `build` -- Outputs the FHIR R4 validated models and artifacts for the: specification, coordinator and apigee proxies into the corresponding `dist/` directories
 * `test` -- Performs quality checks including linting, licence checking of dependencies and unit/low level integration tests
 * `release` -- Pulls all the artifacts for the individual components together and arranges them in a format ready to deploy; used mainly by CI but useful to check the output matches expectations

#### Run commands
 * `run-specification` -- Serves a preview of the specification in human-readable format
 * `run-coordinator` -- Run the coordinator locally

All `run-*` make targets rely on the corresponding `build-*` make targets, the `build` make target will run all of these

#### Tool commands
 * `update-prescriptions` -- Updates examples with newly generated prescription ids/short prescription ids and updates authored on fields, use this in combination with tools for signing the examples to test dispensing in integration environments

### Running tests
#### Unit and Integration tests
To run tests for the coordinator: while in the coordinator folder, run
```
npm t
```

#### End-to-end tests
See [end to end tests](./tests/e2e/README.md) for more details

### VS Code Plugins
 * [openapi-lint](https://marketplace.visualstudio.com/items?itemName=mermade.openapi-lint) resolves links and validates entire spec with the 'OpenAPI Resolve and Validate' command
 * [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) provides sidebar navigation


### Emacs Plugins
 * [**openapi-yaml-mode**](https://github.com/esc-emacs/openapi-yaml-mode) provides syntax highlighting, completion, and path help

### Speccy
> [Speccy](http://speccy.io/) *A handy toolkit for OpenAPI, with a linter to enforce quality rules, documentation rendering, and resolution.*

Speccy does the lifting for the following npm scripts:

 * `lint` -- Lints the definition
 * `resolve` -- Outputs the specification as a **single file**
 * `serve` -- Serves a preview of the specification in human-readable format

(Workflow detailed in a [post](https://developerjack.com/blog/2018/maintaining-large-design-first-api-specs/) on the *developerjack* blog.)

:bulb: The `resolve -i` command is useful when uploading to Apigee which requires the spec as a single file. The `-i` argument ensures that all `$ref`'s are replaced with the referenced file or internal object's content

### Caveats

#### Swagger UI
Swagger UI unfortunately doesn't correctly render `$ref`s in examples, so use `speccy serve` instead.

#### Apigee Portal
The Apigee portal will not automatically pull examples from schemas, you must specify them manually.

#### Platform setup
Successful deployment of the API Proxy requires:

 * A *Target Server* named `ig3`

:bulb: For Sandbox-running environments (`test`) these need to be present for successful deployment but can be set to empty/dummy values.

## Release notes
The project includes a script to calculate the difference between two different versions of the API and provide a template for generating release notes. The script is available as a makefile command:

```
make identify-external-release-changes
```

By default, this will compare the currently deployed version on `internal-dev` and the deployed version on `int` and provide a summary of all changes. You can specify an arbitrary tag to deploy with the `DEPLOY_TAG` argument:

```
make identify-external-release-changes DEPLOY_TAG=v1.0.638-beta
```

This will use the specified tag as the proposed release candidate instead of the version currently deployed to `internal-dev`

# Validator
The FHIR Validator is fetched during CI for a specific released tag. To see the released tag currently being used you can review the `Download Validator` step [version](azure/azure-build-pipeline.yml)

## Running the validator locally
You can also run the validator locally by cloning the repo in the parent folder of this checked out repo

```
$ cd ../
$ git clone --depth 1 --branch <version> https://github.com/NHSDigital/validation-service-fhir-r4.git validator
$ cd electronic-prescription-service-api
$ make install-validator
$ make build-validator
$ make run-validator
```

```
3077-incorrect-artifact-download-b 2
```
