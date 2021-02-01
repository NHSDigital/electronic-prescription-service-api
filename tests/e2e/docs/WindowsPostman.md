## Generating Postman collections on Windows

Run create-smoke-tests to create a live or sandbox pact then generate-postman-collection to create postman collections from the pacts. These will be created under `tests/e2e/postman/collections`

```
make mode=live create-smoke-tests
make generate-postman-collection
```
