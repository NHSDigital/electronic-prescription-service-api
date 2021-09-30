# Electronic Prescription Service API Tool

This is a hosted site to assist with testing and tracking implemented features for the *Electronic Prescription Service FHIR® API*.

Smartcard auth is enabled by default so when navigating to homepage and selecting login you will be redirected to authenticate with a smartcard.

If you don't have a smartcard you can navigate to `/change-auth` to select simulated auth instead

## Backend

The tool is configured against EPS environments so any created prescriptions will be created and persisted in the matching EPS environment

## Features

* Parse a FHIR prepare nominated-pharmacy prescription-order into a readable format - (allows anonymous users)
* Read a test pack of prescription and patient data (see example `test_pack.xlsx`)
* Amend a prescription to be nominated to another pharmacy
* Sign a prescription(s)
* Send a prescription(s)
* Create copies of a prescription to bulk sign and send
* Release prescriptions for a pharmacy
* Dispense a prescription

## Local development

```
make build
make run
```
Navigate to http://localhost:9000
