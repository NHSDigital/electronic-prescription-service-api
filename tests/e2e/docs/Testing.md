## Testing

Limitations in automated e2e tests: 
  * Fresh IDs are generated when running these smoke tests so signatures will not be valid
  * Short form prescription ID on generated prescription IDs has a hard-coded organisation code of 'A99968'

For testing prescriptions with valid signatures which we would expect to be able to be dispensed see **[Testing with Dispensers](./TestingDispensing.md)**

### Sandbox Proxies
```
make mode=sandbox create-smoke-tests
make env=internal-dev-sandbox run-smoke-tests
```

### Live Proxies
```
make mode=live create-smoke-tests
make env=int token=iy8f2ZV8zsIqQilurliBlRIK3a01 run-smoke-tests
```

### PR Proxies

#### Sandbox version
```
make mode=sandbox create-smoke-tests
make env=internal-dev-sandbox pr=333 run-smoke-tests
```
OR
#### Live version
```
make mode=live create-smoke-tests
make env=internal-dev pr=333 token=qvgsB5OR0QUKppg2pGbDagVMrj65 run-smoke-tests
```