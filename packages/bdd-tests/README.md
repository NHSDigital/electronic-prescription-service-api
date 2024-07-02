# Jest-Cucumber BDD Test Suite

These tests will run again internal-dev or internal-qa environments only

Set NODE_ENV to the environment you like to run the test in (QA/DEV)

Default set to Dev.

### To run tests
npm run test

### To run a specific feature file, run the corresponding steps file for the feature file
npm run test -- dispenseNotificationSteps.ts

### To run a single scenario or some set of scenario, add the include or exclude tag on the scenario
@included or @excluded


*** You will need the privateKey file to run this. We will need to create a mock
certificate to be able to commit the privateKey File in git

*** You need to set your client_id and client_secret on your local workspace or server for the environment
you want to run again e.g. internal-dev or internal-qa
e.g.
export client_id=${client_id value}
export client_secret=${client_secret value}
export private_key={your_private_key}  
