# Electronic Prescription Service API Tool - E2E Tests

## Prerequisites for WSL2 / Linux

If you want to run Selenium tests on WSL2, you will need to do the following:

1. Install WSL2
1. Install Firefox as detailed here: https://askubuntu.com/questions/1444962/cant-install-firefox-in-wsl-since-it-sais-i-need-to-use-snap-but-snap-doesnt

Useful links:
- https://stackoverflow.com/questions/61110603/how-to-set-up-working-x11-forwarding-on-wsl2
- https://blog.henrypoon.com/blog/2020/09/27/running-selenium-webdriver-on-wsl2/


## Running tests

Set the following environment variables to be able to run Selenium tests through Firefox locally:

- Windows
```powershell
$env:LOCAL_MODE="true"
$env:FIREFOX_BINARY_PATH="C:\Program Files\Mozilla Firefox\firefox.exe"  # <-- check this is the correct path for your setup
```

- WSL2 / Linux
```bash
export LOCAL_MODE="true"
export FIREFOX_BINARY_PATH=$(which firefox)
```


Optional config for running tests against a specific environment:

- Windows
```powershell
$env:SERVICE_BASE_PATH="<service_base_path>" # defaults to 'eps-api-tool'
$env:APIGEE_ENVIRONMENT="<apigee_environment>" # defaults to 'internal-dev'
```

- WSL2 / Linux
```bash
export SERVICE_BASE_PATH="<service_base_path>" # defaults to 'eps-api-tool'
export APIGEE_ENVIRONMENT="<apigee_environment>" # defaults to 'internal-dev'
```

To run (on any platform):

```powershell
npm ci
npm run test-live
--or--
npm run test-sandbox
```

## Test packs
Optional sheets: Patients, Organisations, Accounts
Mandatory Sheets: Prescriptions

For test packs to work correctly the column headers must be the following:

### Patients
Test ref, NHS_NUMBER, TITLE, FAMILY_NAME, GIVEN_NAME, OTHER_GIVEN_NAME, GENDER, DATE_OF_BIRTH, ADDRESS_LINE_1, ADDRESS_LINE_2, ADDRESS_LINE_3, ADDRESS_LINE_4, POST_CODE

### Organisations
Test, ODS Code, Role Code, Role Name, Name, Address, City, District, Telecom

### Accounts
Test, ODS Code, Role Code, Role Name, Name, Address, City, District, Telecom

### Prescriptions
Test, Treatment Type, prescriptionType, Medication, Medication Snomed, Quantity, Unit of Measure, Unit of Measure Snomed
Endorsements, Dosage Instructions, Number of Issues, issueDurationInDays, Dispenser Notes, Nominated Pharmacy, Nominated Pharmacy Type, Controlled Drug Schedule Controlled Drug Quantity, Patient additional Instructions, Start Date



Tested on Firefox Version 96.0.3

TODO: add how to run only some tests
