## Testing

Limitations: fresh ids are generated when running these smoke tests so signatures will not be valid
For testing with a valid prescription see **[Testing Dispensing](./TestingDispensing.md)**

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