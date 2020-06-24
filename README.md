# electronic-prescription-service-api

[![Build Status](https://dev.azure.com/NHSD-APIM/API%20Platform/_apis/build/status/NHSDigital.electronic-prescription-service-api?branchName=master)](https://dev.azure.com/NHSD-APIM/API%20Platform/_build/latest?definitionId=7&branchName=master)

This is a RESTful HL7® FHIR® API specification for the *Electronic Prescription Service API*.

* `specification/` This [Open API Specification](https://swagger.io/docs/specification/about/) describes the endpoints, methods and messages exchanged by the API. Use it to generate interactive documentation; the contract between the API and its consumers.
* `sandbox/` This NodeJS application implements a mock implementation of the service. Use it as a back-end service to the interactive documentation to illustrate interactions and concepts. It is not intended to provide an exhaustive/faithful environment suitable for full development and testing.
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
There are `make` commands that alias some of this functionality:
 * `test` -- Performs quality checks including linting, licence checking of dependencies and unit/low level integration tests
 * `build` -- Outputs the FHIR R4 validated models and artifacts for the: specification, sandbox, coordinator and apigee proxies into the corresponding `dist/` directories
 * `release` -- Pulls all the artifacts for the individual components together and arranges them in a format ready to deploy; used mainly by CI but useful to check the output matches expectations
 * `clean` -- Removes the output from the build
 * `run-specification` -- Serves a preview of the specification in human-readable format
 * `run-sandbox` -- Run the sandbox locally
 * `run-coordinator` -- Run the coordinator locally

All `run-*` make targets rely on the corresponding `build-*` make targets, the `build` make target will run all of these

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

In order for local tests to work, you must have the sandbox server running locally.

```
make run-sandbox
```

To run all local tests (includes unit and integration tests) for the sandbox: while in the root folder, run
```
make test
```

There is a template environment file available at `tests/e2e/environments/postman_environment.json.template` useful for configuring different testing environments (such as on the CI server).

The makefile sets defaults for the environment variables required for local testing, the CI server overrides these.

### VS Code Plugins

 * [openapi-lint](https://marketplace.visualstudio.com/items?itemName=mermade.openapi-lint) resolves links and validates entire spec with the 'OpenAPI Resolve and Validate' command
 * [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) provides sidebar navigation


### Emacs Plugins

 * [**openapi-yaml-mode**](https://github.com/esc-emacs/openapi-yaml-mode) provides syntax highlighting, completion, and path help

### Speccy

> [Speccy](http://speccy.io/) *A handy toolkit for OpenAPI, with a linter to enforce quality rules, documentation rendering, and resolution.*

Speccy does the lifting for the following npm scripts:

 * `test` -- Lints the definition
 * `publish` -- Outputs the specification as a **single file** into the `build/` directory
 * `serve` -- Serves a preview of the specification in human-readable format

(Workflow detailed in a [post](https://developerjack.com/blog/2018/maintaining-large-design-first-api-specs/) on the *developerjack* blog.)

:bulb: The `publish` command is useful when uploading to Apigee which requires the spec as a single file.

### Caveats

#### Swagger UI
Swagger UI unfortunately doesn't correctly render `$ref`s in examples, so use `speccy serve` instead.

#### Apigee Portal
The Apigee portal will not automatically pull examples from schemas, you must specify them manually.

### Postman Collection

`electronic-prescription-service-api-sandbox.json` must be kept in sync with the OAS and Sandbox manually.

Procedure:
 * Import the collection into Postman
 * Update requests and export the collection back into the repo
 * Re-generate the [Run in Postman button](https://learning.getpostman.com/docs/postman-for-publishers/run-in-postman/creating-run-button/) Markdown button link and update the OAS

#### Platform setup

Successful deployment of the API Proxy requires:

 1. A *Target Server* named `ig3`
 2. A *Key-Value Map* named `eps-variables`, containing:
    1. Key: `NHSD-ASID`, Value: Accredited System ID (ASID) identifying the API Gateway

:bulb: For Sandbox-running environments (`test`) these need to be present for successful deployment but can be set to empty/dummy values.
