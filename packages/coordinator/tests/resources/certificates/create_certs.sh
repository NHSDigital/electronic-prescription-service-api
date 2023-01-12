#!/bin/bash

readonly BASE_DIR=$(pwd)
readonly CERTS_DIR="${BASE_DIR}/certs"
readonly KEYS_DIR="${BASE_DIR}/private"
readonly CRL_DIR="${BASE_DIR}/crl"
readonly CONFIG_DIR="${BASE_DIR}/config"

# OpenSSL Configs
readonly CA_CERT_SIGNING_CONFIG="openssl-ca.conf"
readonly SMARTCARD_CERT_SIGNING_CONFIG="openssl-smartcard.conf"

# CA Signing Config
readonly CA_KEY="cakey.pem"
readonly CA_CERT="cacert.pem"
readonly CA_CERT_DAYS="3650"
readonly CA_CERTIFICATE_SUBJECT="/C=GB/ST=Leeds/L=Leeds/O=nhs/OU=EPS Mock CA/CN=EPS Mock Root Authority"

# Smartcard certificate config
readonly SMARTCARD_CERT_NAME="smartcardcert"
readonly SMARTCARD_CSR="${SMARTCARD_CERT_NAME}.csr"
readonly SMARTCARD_CERT_PEM="${SMARTCARD_CERT_NAME}.pem"
readonly SMARTCARD_CERT_CRT="${SMARTCARD_CERT_NAME}.crt"
readonly SMARTCARD_CERT_SUBJECT="/C=GB/ST=Leeds/L=Leeds/O=nhs/OU=EPS Mock Cert/CN=Signature Verification Tests - Valid Cert"
# v3 extensions
readonly V3_EXT="${BASE_DIR}/v3.ext"

# Recreate output dirs
rm -rf "$CERTS_DIR" "$KEYS_DIR" "$CRL_DIR" "$CONFIG_DIR"
mkdir "$CERTS_DIR" "$KEYS_DIR" "$CRL_DIR" "$CONFIG_DIR"
rm -f "${CONFIG_DIR}/index.txt*" "${CONFIG_DIR}/serial.txt*"

# Create database and serial files
touch "${CONFIG_DIR}/index.txt"
echo '01' > "${CONFIG_DIR}/serial.txt"

# Generate CA key
echo "@ Generating CA credentials..."
openssl genrsa -out "${KEYS_DIR}/${CA_KEY}" 4096

# Create CA certificate
openssl req -new -x509 -days "$CA_CERT_DAYS" -config "${BASE_DIR}/${CA_CERT_SIGNING_CONFIG}" \
-key "${KEYS_DIR}/${CA_KEY}" \
-out "${CERTS_DIR}/${CA_CERT}" -outform PEM -subj "$CA_CERTIFICATE_SUBJECT"


# Create CSR for the mock smarcard certificate
echo "@ Generating smartcard credentials..."
openssl req -config "${BASE_DIR}/$SMARTCARD_CERT_SIGNING_CONFIG" -newkey rsa:2048 -sha256 -nodes \
-out "$SMARTCARD_CSR" -outform PEM -subj "$SMARTCARD_CERT_SUBJECT" -set_serial "0x`openssl rand -hex 8`"

# Sign certificate using CA key
echo "@ Signing smartcard cert with CA..."
openssl ca -config "${BASE_DIR}/$CA_CERT_SIGNING_CONFIG" -policy signing_policy -extensions signing_req \
-out "${CERTS_DIR}/${SMARTCARD_CERT_PEM}" -infiles "$SMARTCARD_CSR"

# openssl x509 -req -in "$SMARTCARD_CSR" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial -out "$SMARTCARD_CERT_CRT" -days 500 -sha256 -extfile "$V3_EXT"

# Convert certificate from PEM to DER
echo "@ Converting smartcard cert to DER format..."
openssl x509 -outform DER -in "${CERTS_DIR}/$SMARTCARD_CERT_PEM" -out "${CERTS_DIR}/${SMARTCARD_CERT_CRT}"

# # Generate private key without password
# openssl genrsa -out "$PRIVATE_KEY" 2048

# # Extract public key
# openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY"

# # # Create self-signed
# # openssl req -new -x509 -key private.key -out publickey.cer -days 365

# # Create Certificate Signing Request (CSR)
# openssl req -new -key "$PRIVATE_KEY" -out "${CERTIFICATE_NAME}.csr" -subj "$CERTIFICATE_SUBJECT"

# # Print self-signed certificate
# openssl x509 -in "${CERTIFICATE_NAME}.cert.pem" -text -noout

# # Print self-signing request
# openssl req -in "${CERTIFICATE_NAME}.csr" -text -noout

