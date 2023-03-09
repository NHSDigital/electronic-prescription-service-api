# Jest-Cucumber BDD Test Suite

These tests will run again internal-dev or internal-qa environments only

Set NODE_ENV to the environment you like to run the test in (QA/DEV)

Default set to Dev.

### To run tests
npm run tests

### To run a specific feature file, run the corresponding steps file for the feature file
npm run test -- dispensenotification-steps.ts

### To run a single scenario or some set of scenario, add the include or exclude tag on the scenario
@included or @excluded


*** You will need the privateKey file to run this. We will need to create a mock
certificate to be able to commit the privateKey File in git
