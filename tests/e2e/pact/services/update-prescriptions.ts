import * as uuid from "uuid"
import {fhir, fetcher} from "@models"
import {
  getResourcesOfType,
  convertFhirMessageToSignedInfoMessage
} from "@coordinator"
import * as crypto from "crypto"
import fs from "fs"
import * as LosslessJson from "lossless-json"

const privateKeyPath = process.env.SIGNING_PRIVATE_KEY_PATH
const x509CertificatePath = process.env.SIGNING_CERT_PATH

export async function updatePrescriptions(): Promise<void> {
  const replacements = new Map<string, string>()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let signPrescriptionFn = (prepareRequest: fhir.Bundle, processRequest: fhir.Bundle): void => {return}

  // eslint-disable-next-line no-constant-condition
  if (fs.existsSync(privateKeyPath) && fs.existsSync(x509CertificatePath))
  {
    signPrescriptionFn = signPrescription
  }
  else {
    console.warn("No private key / x509 certifcate found, signing has been skipped")
  }

  fetcher.prescriptionOrderExamples.filter(e => e.isSuccess).forEach(async(processCase) => {
    const prepareBundle = clone(processCase.prepareRequest)
    const processBundle = clone(processCase.request)
    const firstGroupIdentifier = getResourcesOfType.getMedicationRequests(processBundle)[0].groupIdentifier

    const newBundleIdentifier = uuid.v4()

    const originalShortFormId = firstGroupIdentifier.value
    const newShortFormId = generateShortFormId(originalShortFormId)
    replacements.set(originalShortFormId, newShortFormId)

    const originalLongFormId = getLongFormIdExtension(firstGroupIdentifier.extension).valueIdentifier.value
    const newLongFormId = uuid.v4()
    replacements.set(originalLongFormId, newLongFormId)

    setPrescriptionIds(processBundle, newBundleIdentifier, newShortFormId, newLongFormId)
    setTestPatientIfProd(processBundle)
    signPrescriptionFn(prepareBundle, processBundle)
  })

  fetcher.prescriptionOrderUpdateExamples.filter(e => e.isSuccess).forEach(async (processCase) => {
    const bundle = clone(processCase.request)
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

function signPrescription(prepareRequest: fhir.Bundle, processRequest: fhir.Bundle) {
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
  const certificateValue = certificate.split("\n")[1].trimEnd()
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
  const provenance = getResourcesOfType.getProvenances(processRequest)[0]
  provenance.signature[0].when = timestampParameter.valueString
  provenance.signature[0].data = Buffer.from(xmlDSig, "utf-8").toString("base64")

  try {
    const signatureVerifier = crypto.createVerify("RSA-SHA1")
    signatureVerifier.update(digest)
    const verified = signatureVerifier.verify(certificate, signature, "base64")
    if (!verified) {
      throw new Error("Signature failed verification")
    }
  }
  catch {
    throw new Error("Signature failed verification")
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

function clone<T>(input: T): T {
  return LosslessJson.parse(LosslessJson.stringify(input))
}
