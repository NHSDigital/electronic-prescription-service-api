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
readonly CA_NAME="ca"
readonly CA_CERT_DAYS="3650"
readonly CA_CERTIFICATE_SUBJECT="/C=GB/ST=Leeds/L=Leeds/O=nhs/OU=EPS Mock CA/CN=EPS Mock Root Authority"

# Smartcard config
readonly SMARTCARD_NAME="smartcard"
readonly SMARTCARD_CERT_SUBJECT="/C=GB/ST=Leeds/L=Leeds/O=nhs/OU=EPS Mock Cert/CN=Signature Verification Tests - Valid Cert"
# v3 extensions
readonly V3_EXT="$BASE_DIR/v3.ext"

function revoke_cert {
    local readonly cert_name="$1"
    local readonly crl_reason="$2"
    openssl ca -config openssl-ca.conf -revoke "./certs/${cert_name}cert.pem" -crl_reason "$crl_reason"
}

function generate_crl {
    openssl ca -config openssl-ca.conf -gencrl -out "$CRL_DIR/rootca.crl"
}

function convert_cert_to_der {
    local readonly cert_name="$1"
    echo "@ Converting $cert_name to DER format..."
    openssl x509 -outform DER -in "$CERTS_DIR/${cert_name}cert.pem" -out "$CERTS_DIR/${cert_name}cert.crt"
}

function generate_key {
    local readonly key_name="$1"
    echo "@ Generating key '$key_name'..."
    openssl genrsa -out "${KEYS_DIR}/${key_name}key.pem" 4096
}

function generate_ca_cert {
    local readonly key_name="$1"
    echo "@ Generating CA certificate..."
    openssl req -new -x509 -days "$CA_CERT_DAYS" -config "$BASE_DIR/$CA_CERT_SIGNING_CONFIG" \
    -key "$KEYS_DIR/${key_name}key.pem" \
    -out "$CERTS_DIR/${key_name}cert.pem" -outform PEM -subj "$CA_CERTIFICATE_SUBJECT"
}

function create_csr {
    local readonly key_name="$1"
    local readonly cert_subject="$2"

    echo "@ Creating CRS for '$key_name'..."
    openssl req -config "${BASE_DIR}/$SMARTCARD_CERT_SIGNING_CONFIG" -new \
    -key "$KEYS_DIR/${key_name}key.pem" \
    -out "$key_name.csr" -outform PEM -subj "$cert_subject"
}

function sign_csr_with_ca {
    local readonly key_name="$1"
    echo "@ Using CSR to generate signed cert for '$key_name'..."
    openssl ca -config "$BASE_DIR/$CA_CERT_SIGNING_CONFIG" -policy signing_policy -extensions signing_req \
    -out "$CERTS_DIR/${key_name}cert.pem" -infiles "$key_name.csr"
}

function generate_ca_signed_cert {
    local readonly key_name="$1"
    local readonly cert_subject="$2"

    create_csr "$key_name" "$cert_subject"
    sign_csr_with_ca "$key_name"
}

# Recreate output dirs
rm -rf "$CERTS_DIR" "$KEYS_DIR" "$CRL_DIR" "$CONFIG_DIR"
mkdir "$CERTS_DIR" "$KEYS_DIR" "$CRL_DIR" "$CONFIG_DIR"

# Create database and serial files
touch "$CONFIG_DIR/index.txt"
echo '1000' > "$CONFIG_DIR/crlnumber.txt"
echo '01' > "$CONFIG_DIR/serial.txt"

# Generate CA key and self-signed cert
echo "@ Generating CA credentials..."
generate_key "$CA_NAME"
generate_ca_cert "$CA_NAME"

# Generate smartcard key and CA signed cert
generate_key "$SMARTCARD_NAME"
generate_ca_signed_cert "$SMARTCARD_NAME" "$SMARTCARD_CERT_SUBJECT"

convert_cert_to_der "$CA_NAME"
convert_cert_to_der "$SMARTCARD_NAME"

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

