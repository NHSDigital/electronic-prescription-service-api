# Prescription Coordinator
Handles message translation between FHIR and HL7v3, and distribution to other services.
Backend for the production EPS FHIR API.

API Server built using [hapi](https://hapi.dev/) framework deployable as a [Apigee Hosted Target](https://docs.apigee.com/api-platform/hosted-targets/hosted-targets-overview).

## Developing
```
npm install
npm run serve
```

To run in dev mode, `npm run start-dev`.
This calls to a FHIR validator on the local system, so any requests to the locally running coordinator will need a `x-skip-validation` header to be `true`.

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
Prescription/dispention endpoints relate to functionality of the API, health routes relate to current API status.

Private Beta:
- [ ] POST `/$convert` Convert a FHIR prescription message into an HL7 V3 ParentPrescription message
- [ ] POST `/$poll/{poll_path}` Send a poll request to SPINE
- [ ] POST `/$prepare` Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber
- [ ] POST `/$process_message` Convert a FHIR prescription message into an HL7 V3 ParentPrescription message and send to SPINE

Technical Alpha:
- [ ] POST `/Task/$release` Download a prescription for dispensing

### Example generation
Valid FHIR messages can be generated using `npm run create-examples` that can be used to test various parts of the system.
