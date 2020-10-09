# Prescription Coordinator

API Server built using [hapi](https://hapi.dev/) framework deployable as a [Apigee Hosted Target](https://docs.apigee.com/api-platform/hosted-targets/hosted-targets-overview).

Deals with message translation and distribution to other services. Backend for the production EPS FHIR API.

## Developing

```
npm install
npm run serve
```

### Directories in /src
- `/models` Typescript interface/class definitions
- `/resources` mustache template files for xml responses
- `/routes` API endpoint definitions
- `/services` FHIR translations
  - `/formatters` builds xml
  - `/handlers` defines spine and sandbox handlers - how each of the endpoints respond to requests
  - `/serialisation` xml serialisation
  - `/translation` conversion of valid HL7 FHIR message to HL7V3 ParentPrescription message
  - `/validation` incoming FHIR payload validation on API request

## Deployment

Redeploy the API Proxy. See the main [README.md](../README.md).

## Endpoints

Endpoints are found in `/src/routes`.
Prescription endpoints relate to functionality of the API, health routes relate to current API status.

- [ ] POST `/$convert` Convert a FHIR prescription message into an HL7 V3 ParentPrescription message
- [ ] POST `/$poll/{poll_path}` Send a poll request to SPINE
- [ ] POST `/$prepare` Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber
- [ ] POST `/$process_message` Convert a FHIR prescription message into an HL7 V3 ParentPrescription message and send to SPINE
