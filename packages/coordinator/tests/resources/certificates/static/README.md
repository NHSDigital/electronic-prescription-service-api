# Static Certs Rationale

The CRL & ARL tests in:
packages/coordinator/tests/services/verification/certificate-revocation.spec.ts

use the HL7v3 input files from:
packages/coordinator/tests/resources/signed-prescriptions

Replacing the cert in the existing test file (ValidSignature.xml) dynamically is difficult due to the HL7v3 model not allowing direct access to the element holding the cert.
For this reason, certWithRevokedCa.pem and validSmartcard.pem were generated using `make generate-mock-certs` and put into new test files named SignatureCertCaOnArl.xml and SignatureCertCaNotOnArl.xml repectively.

The tests that use these files depend upon the corresponding CA certs and ARL, generated during the *same* execution of `make generate-mock-certs`.
These are held in this directory and are used as follows.

## ca.pem
This is the CA for validSmartcard.pem. It is _not_ included on the ARL. It is added as an environment variable in the tests.

## revokedCa.pem
This is the CA for certWithRevokedCa.pem. It _is_ included on the ARL. It is added as an environment variable in the tests.

## ca.crl
This is the ARL that contains an entry for revokedCa.pem. It is returned by moxios when the ARL is being fetched.
