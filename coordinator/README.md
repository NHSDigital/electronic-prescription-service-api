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

- [ ] POST `/ConvertFullMessage`
- [ ] POST `/ConvertSignatureFragments`
