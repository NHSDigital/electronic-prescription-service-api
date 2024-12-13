# End to end tests using pact

This contains code to create pacts and verify them as a provider

Tests can be run against any deployed version of a proxy, follow the [setup and install](#setup) to get started.

Once setup see:

**[Add a new example](./docs/AddingExamples.md)**


### To run locally

You can run the tests locally against any deployed proxy.   
You need to set the following environment variables:
```
export PACT_PROVIDER=eps
export PACT_CONSUMER=eps-test-client
export PACT_VERSION=local_testing
export API_CLIENT_ID=<api_client_id>
export API_CLIENT_SECRET=<api_client_secret>
export APIGEE_ENVIRONMENT=internal-dev
```
For APIM deployed proxy set this
```
export PACT_PROVIDER_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/electronic-prescriptions # can also point to a pull request
export API_PRODUCT=live
```

For proxygen deployed proxy set this
```
export PACT_PROVIDER_PRESCRIBING_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/fhir-prescribing # can also point to a pull request
export PACT_PROVIDER_DISPENSING_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/fhir-dispensing # can also point to a pull request
export API_PRODUCT=proxygen
```

The `api_client_id` and `api_client_secret` can be found from the developer portal.
Now run ONE of the following commands to create the pact files locally:

```
make create-live-pacts
make create-sandbox-pacts
make create-proxygen-pacts
```

To run the pacts use the following
```
make verify-pacts
```
This will run the smoke tests from your machine, using the pacts created by the above command.
