# Prescription Coordinator
Handles message translation between FHIR and HL7 V3, and distribution to other services.
Backend for the production EPS FHIR API.

API Server built using [hapi](https://hapi.dev/) framework deployable as a [Apigee Hosted Target](https://docs.apigee.com/api-platform/hosted-targets/hosted-targets-overview).

## Developing
```
npm install
npm run serve
```

To run in dev mode, `npm run start-dev`.
Calls to translation endpoints require the FHIR validator running on the local system by default...
You can include a `x-skip-validation` (set to `true`) header on requests to the coordinator to avoid running the validator.
Alternatively, for help running the validator locally review the `Validator` section of the docs [here](../README.md).

### Directories in /src
- `/models` Typescript interface/class definitions
- `/resources` mustache template files for xml responses
- `/routes` API endpoint definitions
- `/services` FHIR translations
  - `/formatters` builds xml
  - `/handlers` definitions of how each endpoint responds to requests
  - `/serialisation` xml serialisation
  - `/translation` conversion between FHIR messages and equivalent HL7V3 messages
  - `/validation` incoming FHIR payload validation on API request

## Deployment
Redeploy the API Proxy. See the main [README.md](../README.md).

## Endpoints
Prescribe/dispense endpoints relate to functionality of the API, health routes relate to current API status.

(Technical) Live:
- [ ] POST `/$poll/{poll_path}` Send a poll request to SPINE
- [ ] POST `/$prepare` Generate HL7 V3 signature fragments to be signed by the prescriber from a FHIR prescription
- [ ] POST `/$process_message` (PRESCRIBING)
  Translate a FHIR prescription-order or prescription-order-update message into an HL7 V3 message, send to SPINE and translate response back to FHIR

Technical Alpha:
- [ ] POST `/Task/$release` Translate a FHIR 'release' message to V3, send to SPINE and translate response back to FHIR
- [ ] POST `/$process_message` (DISPENSING)
- [ ] POST `/Task` Translate a FHIR 'return or 'withdraw' message to V3, send to SPINE and translate response back to FHIR

Debug:
- [ ] POST `/$convert` Translate a FHIR message into an HL7 V3  message
- [ ] POST `/$validate` Send a FHIR resource to the Hapi FHIR validator

### Headers
Certain headers change functionality of requests to the API:
- `x-request-id` a GUID - required for requests to the API
- `x-skip-validation` a boolean - skips a request from contacting the FHIR validator
- `x-untranslated-response` a boolean - stops translation of a message from SPINE

### Example generation
Valid FHIR messages can be generated using `npm run create-examples` that can be used to test various parts of the system.
