import * as uuid from "uuid"
import {fhir, fetcher, ProcessCase} from "@models"
import {
  getResourcesOfType,
  convertFhirMessageToSignedInfoMessage
} from "@coordinator"
import * as crypto from "crypto"
import fs from "fs"

const privateKeyPath = process.env.SIGNING_PRIVATE_KEY_PATH
const x509CertificatePath = process.env.SIGNING_X509_CERTIFICATE_KEY_PATH

export function updatePrescriptions(): void {
  const replacements = new Map<string, string>()

  let signPrescriptionFn = (processCase: ProcessCase): void => {}

  if (fs.existsSync(privateKeyPath) && fs.existsSync(x509CertificatePath))
  {
    signPrescriptionFn = signPrescription
  }
  else {
    console.warn("No private key / x509 certifcate found, signing has been skipped")
  }
  
  fetcher.prescriptionOrderExamples.forEach(processCase => {
    const prepareBundle = processCase.prepareRequest
    const processBundle = processCase.request
    const firstGroupIdentifier = getResourcesOfType.getMedicationRequests(prepareBundle)[0].groupIdentifier

    const newBundleIdentifier = uuid.v4()

    const originalShortFormId = firstGroupIdentifier.value
    const newShortFormId = generateShortFormId(originalShortFormId)
    replacements.set(originalShortFormId, newShortFormId)

    const originalLongFormId = getLongFormIdExtension(firstGroupIdentifier.extension).valueIdentifier.value
    const newLongFormId = uuid.v4()
    replacements.set(originalLongFormId, newLongFormId)

    setPrescriptionIds(prepareBundle, newBundleIdentifier, newShortFormId, newLongFormId)
    setPrescriptionIds(processBundle, newBundleIdentifier, newShortFormId, newLongFormId)
    setTestPatientIfProd(prepareBundle)
    setTestPatientIfProd(processBundle)
    signPrescriptionFn(processCase)
  })

  fetcher.prescriptionOrderUpdateExamples.forEach(processCase => {
    const bundle = processCase.request
    const firstGroupIdentifier = getResourcesOfType.getMedicationRequests(bundle)[0].groupIdentifier

    const newBundleIdentifier = uuid.v4()

    const originalShortFormId = firstGroupIdentifier.value
    const newShortFormId = replacements.get(originalShortFormId)

    const originalLongFormId = getLongFormIdExtension(firstGroupIdentifier.extension).valueIdentifier.value
    const newLongFormId = replacements.get(originalLongFormId)

    setPrescriptionIds(bundle, newBundleIdentifier, newShortFormId, newLongFormId)
    setTestPatientIfProd(bundle)
  })
}

export function setPrescriptionIds(
  bundle: fhir.Bundle,
  newBundleIdentifier: string,
  newShortFormId: string,
  newLongFormId: string
): void {
  bundle.identifier.value = newBundleIdentifier
  getResourcesOfType.getMedicationRequests(bundle).forEach(medicationRequest => {
    const groupIdentifier = medicationRequest.groupIdentifier
    groupIdentifier.value = newShortFormId
    getLongFormIdExtension(groupIdentifier.extension).valueIdentifier.value = newLongFormId
  })
}

/**
 * The following methods contain a lot of duplicated code from the coordinator module.
 * TODO - Find a better way to share this code.
 */
export function generateShortFormId(originalShortFormId?: string): string {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = (uuid.v4()).replace(/-/g, "").toUpperCase()
  let prescriptionID = `${hexString.substring(0, 6)}-${originalShortFormId?.substring(7,13) ?? "A12345"}-${hexString.substring(12, 17)}`
  const prscID = prescriptionID.replace(/-/g, "")
  const prscIDLength = prscID.length
  let runningTotal = 0
  let checkValue
  const strings = prscID.split("")
  strings.forEach((character, index) => {
    runningTotal = runningTotal + parseInt(character, 36) * (2 ** (prscIDLength - index))
  })
  checkValue = (38 - runningTotal % 37) % 37
  checkValue = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue+1)
  prescriptionID += checkValue
  return prescriptionID
}

function setTestPatientIfProd(bundle: fhir.Bundle) {
  if (process.env.APIGEE_ENVIRONMENT === "prod") {
    const patient = getResourcesOfType.getPatient(bundle)
    const nhsNumberIdentifier = getNhsNumberIdentifier(patient)
    nhsNumberIdentifier.value = "9990548609"
    patient.name = [
      {
        "use": "usual",
        "family": "XXTESTPATIENT-TGNP",
        "given": [
          "DONOTUSE"
        ],
        "prefix": [
          "MR"
        ]
      }
    ]
    patient.gender = "male"
    patient.birthDate = "1932-01-06",
    patient.address = [
      {
        "use": "home",
        "line": [
          "1 Trevelyan Square",
          "Boar Lane",
          "Leeds",
          "West Yorkshire"
        ],
        "postalCode": "LS1 6AE"
      }
    ]
  }
}

function signPrescription(processCase: ProcessCase) {
  const prepareRequest = processCase.prepareRequest
  const prepareResponse = convertFhirMessageToSignedInfoMessage(prepareRequest)
  const digestParameter = prepareResponse.parameter.filter(p => p.name === "digest")[0] as fhir.StringParameter
  const timestampParameter = prepareResponse.parameter.filter(p => p.name === "timestamp")[0] as fhir.StringParameter
  const digest = Buffer.from(digestParameter.valueString, "base64").toString("utf-8")
  const digestWithoutNamespace = digest.replace(`<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">`, `<SignedInfo>`)
  const signature = crypto.sign("sha1", Buffer.from(digest, "utf-8"), {
    key: fs.readFileSync(privateKeyPath, "utf-8"),
    padding: crypto.constants.RSA_PKCS1_PADDING
  }).toString("base64")
  const certificate = fs.readFileSync(x509CertificatePath, "utf-8")
  const certificateValue = certificate
    .replace("-----BEGIN CERTIFICATE-----\n", "")
    .replace("\n-----END CERTIFICATE-----", "")
  const xmlDSig = `
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  ${digestWithoutNamespace}
  <SignatureValue>${signature}</SignatureValue>
  <KeyInfo>
      <X509Data>
          <X509Certificate>${certificateValue}</X509Certificate>
      </X509Data>
  </KeyInfo>
</Signature>
`
  const bundle = processCase.request
  const provenance = getResourcesOfType.getProvenances(bundle)[0]
  provenance.signature[0].when = timestampParameter.valueString
  provenance.signature[0].data = Buffer.from(xmlDSig, "utf-8").toString("base64")

  const signatureVerifier = crypto.createVerify("RSA-SHA1")
  signatureVerifier.update(digest)
  const verified = signatureVerifier.verify(certificate, signature, "base64")
  if (!verified) {
    throw new Error("Unable to verify signature")
  }
}

function getLongFormIdExtension(extensions: Array<fhir.Extension>): fhir.IdentifierExtension {
  return extensions.find(
    extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"
  ) as fhir.IdentifierExtension
}

function getNhsNumberIdentifier(fhirPatient: fhir.Patient) {
  return fhirPatient
    .identifier
    .filter(identifier => identifier.system === "https://fhir.nhs.uk/Id/nhs-number")[0]
}