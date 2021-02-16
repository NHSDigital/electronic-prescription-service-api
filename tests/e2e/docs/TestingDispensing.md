## Testing Dispensing

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

To sign using a smartcard use prescription signer tool shared with nimbus dev team to sign the prescriptions, build project, copy output files into C://e/sign and create settings.txt here. Set following config  

settings.txt
```
ExamplesDir=<full-path-to-examples-dir>
CardreaderName=<From registry entry: Computer\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography\Calais\Readers>
```

Then sign prescriptions from repo root with

```
make sign-prescriptions
```

#### Send Prescriptions to int
---

Grab an example which has been signed above (under `models/examples/`) and send to int through postman

#### Verify with dispenser
---

Lookup shortform prescription id in pact and use this to find prescription in eps tracker. Ask dispenser to verify