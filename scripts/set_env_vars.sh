#!/bin/bash
set -eu

# CLIENT_KEY=$(cat ~/Documents/DELETE_AFTER_USE/private-key.pem)
# CLIENT_CERT=$(cat ~/Documents/DELETE_AFTER_USE/public-key.pem)
# ROOT_CA_CERT=$(cat ~/Documents/DELETE_AFTER_USE/ca-certs-int/root.pem)
# SUB_CA_CERT=$(cat ~/Documents/DELETE_AFTER_USE/ca-certs-int/sub.pem)

# export CLIENT_KEY
# export CLIENT_CERT
# export ROOT_CA_CERT
# export SUB_CA_CERT

export CLIENT_KEY=
export CLIENT_CERT=
export ROOT_CA_CERT=
export SUB_CA_CERT=

export SANDBOX=0
export FROM_ASID=200000001285
export TO_ASID=567456789789
export CPA_ID_MAP='[["PORX_IN020101UK31","S20001A000100"],["PORX_IN020102UK31","S20000A000086"],["PORX_IN030101UK32","S20001A000126"]]'
export TO_PARTY_KEY="YES-0000806"
export FROM_PARTY_KEY="T141D-822234"
