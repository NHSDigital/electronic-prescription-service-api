# End to end tests using pact

This contains code to create pacts and verify them as a provider.   

Tests can be run against any deployed version of a proxy, follow the [setup and install](#setup) to get started.   

There are two stages to the testing. Create pact step uses jest to create pact files based on examples in this repo. These are defined in the specs folder. 
The sandbox folder contains tests that run against sandbox deployments, and the live folder contains tests that run against a non sandbox deployment.   

The live tests have a 'beforeAll' step which runs updatePrescriptions in services/update-prescriptions.ts which updates the prescription id in the examples and creates a valid signature in the payload that is going to be sent. 

Preparing the tests generates pact files under pact/pacts.


Once the pact files are generated, a verify step is run which runs broker/verify.ts. This runs in a specific order as some of the tests expect prescriptions to be created or released and so are done as one of the initial steps. This script dynamically inserts the target url into the request, and also adds an OAuth2 token to the request header before sending it


If a new example is added, see [Add a new example](./docs/AddingExamples.md) for more details on what needs doing


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
export API_DEPLOYMENT_METHOD=apim
```

For proxygen deployed proxy set this
```
export PACT_PROVIDER_PRESCRIBING_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/fhir-prescribing # can also point to a pull request
export PACT_PROVIDER_DISPENSING_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/fhir-dispensing # can also point to a pull request
export API_DEPLOYMENT_METHOD=proxygen
```

For sandbox testing set this
```
export API_MODE=sandbox
```

For other testing set this
```
export API_MODE=live
```

The `api_client_id` and `api_client_secret` can be found from the developer portal.
Now run ONE of the following commands to create the pact files locally:

```
make create-apim-pacts
make create-sandbox-pacts
make create-proxygen-pacts
```

To run the pacts use the following
```
make verify-pacts
```
This will run the smoke tests from your machine, using the pacts created by the above command.
