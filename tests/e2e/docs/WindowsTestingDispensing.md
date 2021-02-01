## Testing Dispensing on Windows

1. **Update prescriptions** - Update example prescriptions with new ids to be able to send to spine int - script updates ids in request examples, sends them to a deployed sandbox api (can be a pr version) and updates the expected convert and prepare responses 
2. **Sign prescriptions** -  Sign updated example prescriptions now that the ids have changed - prescription signer signs prescriptions so they can be sent to int for a dispenser to verify
3. **Send Prescriptions to int** - Send updated and signed prescription to int (automated or manual)
4. **Verify with dispenser** - Lookup prescription in tracker with shortform prescription id; contact dispenser and ask to verify

#### Update prescriptions
---

#### Main sandbox version
```
make env=internal-dev-sandbox update-prescriptions
```
OR
#### Pr sandbox version
```
make env=internal-dev-sandbox pr=333 update-prescriptions
```

#### Sign prescriptions
---

Use prescription signer tool shared with nimbus dev team to sign the prescriptions, build project, copy output files into C://e/sign, update settings.txt as needed

```
make sign-prescriptions
```

#### Send Prescriptions to int
---

Run smoke tests against int manually OR merge PR with updated and signed examples and release a new version to int through pipeline. Manual method below:

```
make mode=live create-smoke-tests
make env=int token=iy8f2ZV8zsIqQilurliBlRIK3a01 run-smoke-tests
```

#### Verify with dispenser
---

Lookup shortform prescription id in pact and use this to find prescription in eps tracker. Ask dispenser to verify