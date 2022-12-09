## Generating Postman collections

Run create-smoke-tests to create a live pact then generate-postman-collection to create postman collections from the pacts. These will be created under `tests/e2e/postman/collections`

```
make mode=live create-smoke-tests
make env=int token=PxfZQbD3zIGGJK1AAVQWN7iIuh38 generate-postman-collection
```
