# Pact E2E Integration Tests

## Dependencies

```
npx
npm
```

## Create Pacts

```
make create-pacts
```

## Run Publish

Ensure you have set environment variables for `APIGEE_ENVIRONMENT`, `PACT_BROKER_BASIC_AUTH_USERNAME`, `PACT_BROKER_BASIC_AUTH_PASSWORD` and `PACT_BROKER_URL`

```
make publish-pacts
```
