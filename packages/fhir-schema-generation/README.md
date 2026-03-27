# FHIR Schema Generation

The detailed specification for EPR FHIR payloads is currently documented in two places.

The actual FHIR package is held in Simplifier along with the Simplifier EPS implementation guide (IG) (https://simplifier.net/guide/nhsengland-eps).

The EPS FHIR API website OAS spec includes an interpretation of each payload as a 'schema'.

Use this package to programmatically generate the OAS schema from the Simplifier profile definitions (that are in json). 


## Run Package
```bash
cd packages/fhir-schema-generation
npm run build
npm run start
```

### Run Dev Package
During development, you may want the script to run from `.ts` without having to build every time.
```bash
cd packages/fhir-schema-generation
npm run dev
```

### Tests
```
cd packages/fhir-schema-generation
npm run test
```