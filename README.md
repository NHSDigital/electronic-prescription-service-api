# electronic-prescription-service-api

[![Build Status](https://dev.azure.com/NHSD-APIM/API%20Platform/_apis/build/status/NHSDigital.electronic-prescription-service-api?branchName=master)](https://dev.azure.com/NHSD-APIM/API%20Platform/_build/latest?definitionId=7&branchName=master)

This is a RESTful HL7® FHIR® API specification for the *Electronic Prescription Service API*.

* `specification/` This [Open API Specification](https://swagger.io/docs/specification/about/) describes the endpoints, methods and messages exchanged by the API. Use it to generate interactive documentation; the contract between the API and its consumers.
* `scripts/` Utilities helpful to developers of this specification.
* `proxies/` Apigee API Proxies
* `coordinator/` Deals with message translation and distribution to other services. Backend for the production EPS FHIR API.
* `models/` A common, single source of truth directory for requests, responses and schemas used by the various components of this solution.

Consumers of the API will find developer documentation on the [NHS Digital Developer Hub](https://emea-demo8-nhsdportal.apigee.io/).

## Contributing
Contributions to this project are welcome from anyone, providing that they conform to the [guidelines for contribution](https://github.com/NHSDigital/electronic-prescription-service-api/blob/master/CONTRIBUTING.md) and the [community code of conduct](https://github.com/NHSDigital/electronic-prescription-service-api/blob/master/CODE_OF_CONDUCT.md).

### Licensing
This code is dual licensed under the MIT license and the OGL (Open Government License). Any new work added to this repository must conform to the conditions of these licenses. In particular this means that this project may not depend on GPL-licensed or AGPL-licensed libraries, as these would violate the terms of those libraries' licenses.

The contents of this repository are protected by Crown Copyright (C).

## Development

### Requirements
* make
* jq
* nodejs + npm/yarn
* [poetry](https://github.com/python-poetry/poetry)

### Install
```
$ make install
```

#### Pre-commit hooks
Some pre-commit hooks are installed as part of the install above to ensure you can't commit invalid spec changes by accident. A combination of these checks are also run in CI.

### Environment Variables
Various scripts and commands rely on environment variables being set. These are documented with the commands.

:bulb: Consider using [direnv](https://direnv.net/) to manage your environment variables during development and maintaining your own `.envrc` file - the values of these variables will be specific to you and/or sensitive.

### Make commands
There are further `make` commands that help alias some functionality during development.

#### Common commands
Common commands needed for development can be run by running the default `make` command. This ouputs to `build.log` and runs the following targets:

 * `clean` -- Removes the output from the build and release commands
 * `install` -- Installs package dependencies for all components
 * `build` -- Outputs the FHIR R4 validated models and artifacts for the: specification, sandbox, coordinator and apigee proxies into the corresponding `dist/` directories
 * `test` -- Performs quality checks including linting, licence checking of dependencies and unit/low level integration tests
 * `release` -- Pulls all the artifacts for the individual components together and arranges them in a format ready to deploy; used mainly by CI but useful to check the output matches expectations
   
#### Run commands
 * `run-specification` -- Serves a preview of the specification in human-readable format
 * `run-sandbox` -- Run the sandbox locally
 * `run-coordinator` -- Run the coordinator locally

All `run-*` make targets rely on the corresponding `build-*` make targets, the `build` make target will run all of these

Make `build-models` is a dependency for all other `build-*` targets, the `build` target will run all builds including this dependency

### Running tests
#### Unit and Integration tests
To run tests for the sandbox: while in the sandbox folder, run
```
npm t
```
To run tests for the coordinator: while in the coordinator folder, run
```
npm t
```

#### End-to-end tests
To run e2e tests for the sandbox, you need to supply an environment. A `local` environment and an environment template are included under `tests/e2e/environments`.

In order for tests under the make target `test-integration-coordinator` to work, you must have built and be running the coordindator locally. In a seperate shell run:

```
make build
make run-coordinator
```

Once the coordinator is up and displaying the port number, in another shell run:

```
make test-integration-coordindator
```

To run all other tests locally (includes unit and low level integration tests): while in the root folder, run

```
make build
make test
```

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

 1. A *Target Server* named `ig3`
 2. A *Key-Value Map* named `eps-variables`, containing:
    1. Key: `NHSD-ASID`, Value: Accredited System ID (ASID) identifying the API Gateway

:bulb: For Sandbox-running environments (`test`) these need to be present for successful deployment but can be set to empty/dummy values.
