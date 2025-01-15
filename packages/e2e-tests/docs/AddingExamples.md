# Adding a new example

New examples can be added in the relevant directory under `examples/primary-care|secondary-care`

Following the convention:

`{number}-{endpoint}-{request|response}-{?operation}-{status}.{ext}`

Number is a way to group requests and responses together in each directory, for example in the below 

```
1-Convert-Response-Send-200_OK.xml
1-Process-Request-Send-200_OK.json
```

the convert response would be set as the expected response for the process request

These examples are then loaded into smoke tests (e2e tests) run during continuous deployment

Operation can be omitted for prepare examples as there is only one operation for this endpoint

The smoke test description is built up from the directory and the filename so tests can be renamed by changing the folder structure

Make sure if you're adding/changing directories that they are present in `pactGroups` in `packages/e2e-tests/resources/common.ts`
