# End to end tests (Smoke tests)

Smoke tests can be run against any deployed version of a proxy, follow the [setup and install](#setup) to get started.

Once setup see:

**[Add a new example](./docs/AddingExamples.md)**

**[Running smoke tests](./docs/Testing.md)**

**[Testing with dispensers](./docs/TestingDispensing.md)**

**[Generating postman collections](./docs/Postman.md)**

## Setup for Windows

### Download

Turn on developer mode *before* cloning repo to allow windows to create symlinks used in repo. See below:

 ![alt text](./docs/WindowsSearch-DeveloperSettings.png "Windows Search - Developer Settings") 
 ![alt text](./docs/DeveloperSettings.png "Developer Settings") 

Save to C://e to avoid long path issue in windows when running smoke-tests (was not resolved by setting to 1 in registry during testing). See below:

```
cd C://
git clone https://github.com/NHSDigital/electronic-prescription-service-api.git e
```

### Install 

Tested on node version: v14.15.4

```
cd C://e
. .\make.ps1 # *see note below
make install-smoke-tests
```

---

**Note:** you can add full path to profile by running "notepad $profile" and adding ". C://e/make.ps1" so it doesn't need to be run every time you open a new powershell window

---

### Configuration

You will need to put the following variables in `envrc.ps1` in repo root, ask nimbus dev team for the values:

```
$env:PACT_BROKER_URL=
$env:PACT_BROKER_BASIC_AUTH_USERNAME=
$env:PACT_BROKER_BASIC_AUTH_PASSWORD=
```

## Setup for WSL

```
make install-smoke-tests
```

### To run

Set the following environment variables:
```
export PACT_PROVIDER=nhsd-apim-eps
export PACT_PROVIDER_URL=https://$APIGEE_ENVIRONMENT.api.service.nhs.uk/$SERVICE_BASE_PATH
export PACT_BROKER_BASIC_AUTH_USERNAME=<broker_username>
export PACT_BROKER_BASIC_AUTH_PASSWORD=<broker_password>
export PACT_BROKER_URL=https://nhsd-pact-broker.herokuapp.com
export PACT_VERSION="$SERVICE_BASE_PATH"
export PACT_USE_BROKER=false
export SERVICE_BASE_PATH=electronic-prescriptions
export API_CLIENT_ID=<api_client_id>
export API_CLIENT_SECRET=<api_client_secret>
export APIGEE_ENVIRONMENT=internal-dev
export APIGEE_KEY=<apigee_key>
```

The `apigee_key` can be found in AWS Parameter Store. 
The `api_client_id` and `api_client_secret` can be found in the Postman environment variables.
For the other bracketed values, consult the dev team.

Now run the following commands to create the pact files locally:
```
export APIGEE_ACCESS_TOKEN=$(npm run --silent fetch-apigee-access-token)
make create-pacts
```

You now have ten minutes to run the smoke tests before your token runs out. You will then need to re-run the two commands to regenerate pacts with valid auth headers.

To run:
```
make verify-pacts
```
This will run the smoke tests from your machine, using the pacts created by the above command.