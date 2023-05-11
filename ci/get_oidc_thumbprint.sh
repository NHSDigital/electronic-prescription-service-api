#!/bin/bash

cert_name="github_oidc_cert.crt"

openssl s_client -servername token.actions.githubusercontent.com -showcerts -connect token.actions.githubusercontent.com:443 < /dev/null 2>/dev/null | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' | sed "0,/-END CERTIFICATE-/d" > $cert_name
openssl x509 -in $cert_name -fingerprint -noout | cut -f2 -d'=' | tr -d ':' | tr '[:upper:]' '[:lower:]'
rm $cert_name
