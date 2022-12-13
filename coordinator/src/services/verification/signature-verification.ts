import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "../serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "../translation/request/signature"
import {createParametersDigest} from "../translation/request"
import crypto from "crypto"
import {isTruthy} from "../translation/common"
import * as fs from "fs"
import * as jsrsasign from "jsrsasign"
import * as pkijs from "pkijs"
import * as asn1 from "asn1js"
import * as pvutils from "pvutils"
import {convertHL7V3DateTimeToIsoDateTimeString, isDateInRange} from "../translation/common/dateTime"
import axios from 'axios'
enum CRLReasonCode {
  Unspecified = 0,
  AffiliationChanged = 3,
  Superseded = 4,
  CessationOfOperation = 5,
  CertificateHold = 6,
  RemoveFromCRL = 8,
}

function verifyPrescriptionSignature(parentPrescription: hl7V3.ParentPrescription): Array<string> {
  const validSignatureFormat = verifySignatureHasCorrectFormat(parentPrescription)
  if (!validSignatureFormat) {

    return ["Invalid signature format"]
  }

  const errors = []

  const validSignature = verifyPrescriptionSignatureValid(parentPrescription)
  if (!validSignature) {
    errors.push("Signature is invalid")
  }

  const matchingSignature = verifySignatureDigestMatchesPrescription(parentPrescription)
  if (!matchingSignature) {
    errors.push("Signature doesn't match prescription")
  }

  const verifyCertificateErrors = verifyCertificate(parentPrescription)
  if (verifyCertificateErrors.length > 0) {
    errors.push(...verifyCertificateErrors)
  }

  const isTrusted = verifyChain(getX509CertificateFromPerscription(parentPrescription))
  if (!isTrusted) {
    errors.push("Certificate not trusted")
  }

  return errors
}

async function verifyCertificateRevoked(parentPrescription: hl7V3.ParentPrescription): Promise<Boolean> {
  const prescriptionDate = new Date(convertHL7V3DateTimeToIsoDateTimeString(parentPrescription.effectiveTime));
  const x509Certificate = getCertificateForRevocation(parentPrescription);
  const serialNumber = x509Certificate.getSerialNumberHex();
  const distributionPointsURI = x509Certificate.getExtCRLDistributionPointsURI()
  if (distributionPointsURI.length > 0) {
    const crtRevocationList = await getRevocationList('http://localhost:10000/crlc2.crl')  
       if (crtRevocationList) {
         return processRevocationList(crtRevocationList, prescriptionDate, serialNumber)
       }
  }
  return false;
}

function getCertificateForRevocation(parentPrescription: hl7V3.ParentPrescription): jsrsasign.X509 {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signature = signatureRoot?.Signature
  const x509CertificateText = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`;

  const x509Certificate= new jsrsasign.X509(x509CertificatePem);
  // const x509Certificate = new jsrsasign.X509(
  //   "-----BEGIN CERTIFICATE-----\nMIIDwjCCAqqgAwIBAgIEXcmi+zANBgkqhkiG9w0BAQsFADA2MQwwCgYDVQQKEwNuaHMxCzAJBgNVBAsTAkNBMRkwFwYDVQQDExBOSFMgSU5UIExldmVsIDFEMB4XDTIwMDgxNTIxNDg1NVoXDTIyMDgxNTIyMTg1NVowTTEMMAoGA1UEChMDbmhzMQ8wDQYDVQQLEwZQZW9wbGUxLDAqBgNVBAMMIzU1NTI1MTU1MzEwM19BcnZpbmRzaGV0dHlfTmlqYW1wdXJlMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQClDsvqqOQC/gQrDH9UX3RKqSMwA27ytMx6FVTE0oznHER0osj3cJuleM/ZqKahOOqRttbmeuo5TyguJ4YDtlXoTnAohwRZDcfyMYsZe6v5vkexysTor7bzR2FCAJXGlLx67hr6CQVS5Yb1edLLoZ12FuGYR4j5z3tORyb0YWB3MQIDAQABo4IBQzCCAT8wDgYDVR0PAQH/BAQDAgZAMGUGA1UdIAEB/wRbMFkwVwYLKoY6AIl7ZgADAgAwSDBGBggrBgEFBQcCARY6aHR0cHM6Ly9wa2kubmhzLnVrL2NlcnRpZmljYXRlX3BvbGljaWVzL2NvbnRlbnRfY29tbWl0bWVudDAzBgNVHR8ELDAqMCigJqAkhiJodHRwOi8vY3JsLm5ocy51ay9pbnQvMWQvY3JsYzIuY3JsMCsGA1UdEAQkMCKADzIwMjAwODE1MjE0ODU1WoEPMjAyMjAxMDgyMjE4NTVaMB8GA1UdIwQYMBaAFKCWH4GEzT3ehFCi+kCyMx8WOTxSMB0GA1UdDgQWBBRhiixpemIrXatog0CaA1saWeOGlTAJBgNVHRMEAjAAMBkGCSqGSIb2fQdBAAQMMAobBFY4LjMDAgSwMA0GCSqGSIb3DQEBCwUAA4IBAQCEgdhe2b6zNgLeXcF5RgltHo/whVIYlMPq7H7vVfOGzVU2Y8VzELu45yICE4gi6kQuzpZw82Kr0CYaOc4YlugVuww6d+lPdskjvw9oPXnC00z1N/zbM9Tas5gNNY1tkMjXqiYkjoVD9xULCve5hnGKPErEBCxOCWFDibWJwyVw68tU7VDywvXBXowhKvP4wn6n+6p4++T84/Vp1nql3ghcuKS5dBMYY6wIC1j6NRg7RbdPlDnchebIFQ6qI+Q67g5UHgW7pHgm1TVsakCnXSYCSkwkiR7KZ+OV4abjH7K0ud1q4/oAkE25D2uExL43KWmi5gtbQJxLLWDmmUJWncLQ\n-----END CERTIFICATE-----"
  // );
  return x509Certificate;
}

async function getRevocationList(crlFileUrl: string): Promise<pkijs.CertificateRevocationList> {
  let crtRevocationList: pkijs.CertificateRevocationList
    const resp = await axios(crlFileUrl, { method: 'GET',  responseType: 'arraybuffer'});
    if (resp.status == 200) {
      const asn1crl = asn1.fromBER(resp.data)
      crtRevocationList = new pkijs.CertificateRevocationList({schema: asn1crl.result})
    }
  return crtRevocationList
}

function processRevocationList(crtRevocationList: pkijs.CertificateRevocationList, presCreationDate: Date, serialNumber: string): boolean {
let IsCertificateRevoked : boolean = false 
  crtRevocationList.revokedCertificates.map(revokedCertificate => {
    const revocationDate = new Date(revokedCertificate.revocationDate.value);
    // Get the serial number for the revoked certificate
    const revokedCertificateSn = pvutils.bufferToHexCodes(revokedCertificate.userCertificate.valueBlock.valueHexView).toLocaleLowerCase()

    if (crtRevocationList.crlExtensions?.extensions) {
      // Check if the CRL Reason Code extension exists
      const crlExtension =revokedCertificate.crlEntryExtensions?.extensions.find(ext => ext.extnID === "2.5.29.21")
      if (crlExtension) {
        const reasonCode = parseInt(crlExtension.parsedValue.valueBlock) 
        if ( reasonCode in CRLReasonCode && revocationDate < presCreationDate && serialNumber === revokedCertificateSn ) {
          IsCertificateRevoked = true;
        }
      }
    }
  }
  )
  return IsCertificateRevoked;
}
function getX509CertificateFromPerscription(parentPrescription: hl7V3.ParentPrescription): crypto.X509Certificate {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const {Signature} = signatureRoot
  const x509CertificateText = Signature.KeyInfo.X509Data.X509Certificate._text
  const x509Certificate = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
  return new crypto.X509Certificate(x509Certificate)
}

function verifyChain(x509Certificate: crypto.X509Certificate): boolean {
  const rootCert = fs.readFileSync(process.env.SUBCACC_CERT_PATH)
  const x509CertificateRoot = new crypto.X509Certificate(rootCert)
  return x509Certificate.checkIssued(x509CertificateRoot)
}

function verifySignatureHasCorrectFormat(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signature = signatureRoot?.Signature
  const signedInfo = signature?.SignedInfo
  const signatureValue = signature?.SignatureValue?._text
  const x509Certificate = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  return isTruthy(signedInfo) && isTruthy(signatureValue) && isTruthy(x509Certificate)
}

function verifySignatureDigestMatchesPrescription(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const digestOnPrescription = extractDigestFromSignatureRoot(signatureRoot)
  const calculatedDigestFromPrescription = calculateDigestFromParentPrescription(parentPrescription)
  console.log(`Digest on Prescription: ${digestOnPrescription}`)
  console.log(`Calculated digest from Prescription: ${calculatedDigestFromPrescription}`)
  return digestOnPrescription === calculatedDigestFromPrescription
}

function verifyPrescriptionSignatureValid(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  return verifySignatureValid(signatureRoot)
}

function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

function verifyCertificateValidWhenSigned(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureTimeStamp = extractSignatureDateTimeStamp(parentPrescription)
  const prescriptionCertificate = getX509CertificateFromPrescription(parentPrescription)
  const signatureDate = new Date(convertHL7V3DateTimeToIsoDateTimeString(signatureTimeStamp))
  const certificateStartDate = new Date(prescriptionCertificate.validFrom)
  const certificateEndDate = new Date(prescriptionCertificate.validTo)
  return isDateInRange(signatureDate, certificateStartDate, certificateEndDate)
}

function getX509CertificateFromPrescription(parentPrescription: hl7V3.ParentPrescription): crypto.X509Certificate {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const {Signature} = signatureRoot
  const x509CertificateText = Signature.KeyInfo.X509Data.X509Certificate._text
  const x509Certificate = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
  return new crypto.X509Certificate(x509Certificate)
}

function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): hl7V3.Timestamp {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return author.time
}

function extractDigestFromSignatureRoot(signatureRoot: ElementCompact) {
  const signature = signatureRoot.Signature
  const signedInfo = signature.SignedInfo
  signedInfo._attributes = {
    xmlns: signature._attributes.xmlns
  }
  return writeXmlStringCanonicalized({SignedInfo: signedInfo})
}

function calculateDigestFromParentPrescription(parentPrescription: hl7V3.ParentPrescription) {
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digestFromPrescriptionBase64 = createParametersDigest(fragmentsToBeHashed)
  return Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")
}

function verifySignatureValid(signatureRoot: ElementCompact) {
  const signatureVerifier = crypto.createVerify("RSA-SHA1")
  const digest = extractDigestFromSignatureRoot(signatureRoot)
  signatureVerifier.update(digest)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text
  const x509Certificate = signature.KeyInfo.X509Data.X509Certificate._text
  const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509Certificate}\n-----END CERTIFICATE-----`
  return signatureVerifier.verify(x509CertificatePem, signatureValue, "base64")
}

function verifyCertificate(parentPrescription: hl7V3.ParentPrescription): Array<string> {
  const errors = []
  const certificateValidWhenSigned = verifyCertificateValidWhenSigned(parentPrescription)
  if (!certificateValidWhenSigned) {
    errors.push("Certificate expired when signed")
  }
  return errors
}

export {
  extractSignatureRootFromParentPrescription,
  verifySignatureDigestMatchesPrescription,
  verifyPrescriptionSignatureValid,
  verifySignatureHasCorrectFormat,
  verifyCertificate,
  verifyChain,
  verifyCertificateRevoked,
  verifyPrescriptionSignature,
  extractSignatureDateTimeStamp,
  verifyCertificateValidWhenSigned
}
