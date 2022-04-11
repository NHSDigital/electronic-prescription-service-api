# Integration tests

Integration tests are sending predefined HTTP requests for all available actions:
* /Endpoint
to a running SDS instance running at `http://localhost:9000/`

Tests assume that target server is connected to test LDAP that supports `YES` organization code
and `urn:nhs:names:services:psis:REPC_IN150016UK05` service id.

## Environment variables

Target SDS server url can be changed using `SDS_ADDRESS` environment variable

## Running tests

Assuming virtual environment has been created using `pipenv install --dev` command,
test can be run by executing `pipenv run inttests`
