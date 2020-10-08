# Prescription Coordinator

API Server built using [hapi](https://hapi.dev/) framework deployable as a [Apigee Hosted Target](https://docs.apigee.com/api-platform/hosted-targets/hosted-targets-overview).

Deals with message translation and distribution to other services. Backend for the production EPS FHIR API.

## Developing

```
npm install
npm run serve
```

## Deployment

Redeploy the API Proxy. See the main [README.md](../README.md).

## Endpoints

- [ ] POST `/$convert` Convert a FHIR prescription message into an HL7 V3 ParentPrescription message
- [ ] POST `/$poll/{poll_path}` Send a poll request to SPINE
- [ ] POST `/$prepare` Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber
- [ ] POST `/$process_message` Convert a FHIR prescription message into an HL7 V3 ParentPrescription message and send to SPINE
