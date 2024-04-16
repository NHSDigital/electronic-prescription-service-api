# Electronic Prescription Service API Tool

This is a hosted site to assist with testing and tracking implemented features for the *Electronic Prescription Service FHIR® API*.


## Backend

The tool is configured against EPS environments so any created prescriptions will be created and persisted in the matching EPS environment.

## Features

* Read FHIR prescriptions and display on ui
* Read a test pack (see examples in `e2e-tests/test-packs` directory)
* Sign a prescription(s)
* Send a prescription(s)
* Release prescription(s)
* Return a prescription
* Dispense a prescription
* Claim for a prescription

## Local development

To spin up client and have changes automatically update the site run:

```
cd site/client
npm run watch
```

To spin up server run:

```
docker-compose build; docker-compose up
```

Navigate to http://localhost:9000

### Notes
When running `docker-compose up`, if you get an error message regarding permissions, make sure that the owner of the `./client/dist` directory is your user (not **root**).
