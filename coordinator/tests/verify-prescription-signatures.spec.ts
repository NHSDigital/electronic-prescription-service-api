import {ElementCompact} from "xml-js"
import {readXml} from "../src/services/serialisation/xml"
import {readFileSync} from "fs"
import * as path from "path"
import {fetcher, hl7V3} from "@models"
import {
  verifyPrescriptionSignatureValid,
  verifySignatureDigestMatchesPrescription
} from "../src/services/signature-verification"

//eslint-disable-next-line max-len
const prescriptionPath = "../../examples/primary-care/acute/no-nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/spurious-code/1-Convert-Response-Send-200_OK.xml"

test.skip("verify digest for specific prescription", () => {
  const prescriptionStr = readFileSync(path.join(__dirname, prescriptionPath), "utf-8")
  const prescriptionRoot = readXml(prescriptionStr)
  warnIfDigestDoesNotMatchPrescription(prescriptionRoot)
})

test.skip("verify signature for specific prescription", () => {
  const prescriptionStr = readFileSync(path.join(__dirname, prescriptionPath), "utf-8")
  const prescriptionRoot = readXml(prescriptionStr)
  warnIfSignatureIsInvalid(prescriptionRoot)
})

const cases = fetcher.convertExamples
  .filter(e => e.isSuccess)
  .filter(e => e.requestFile.operation === "send")
  .map(convertExample => [
    convertExample.description,
    readXml(convertExample.response)
  ])

test.each(cases)("verify prescription signature for %s", (desc: string, hl7V3Message: ElementCompact) => {
  warnIfDigestDoesNotMatchPrescription(hl7V3Message)
  warnIfSignatureIsInvalid(hl7V3Message)
})

function warnIfSignatureIsInvalid(messageRoot: ElementCompact): void {
  // eslint-disable-next-line max-len
  const sendMessagePayload = messageRoot.PORX_IN020101SM31 as hl7V3.SendMessagePayload<hl7V3.ParentPrescriptionRoot>
  const parentPrescription = sendMessagePayload.ControlActEvent.subject.ParentPrescription
  const signatureValid = verifyPrescriptionSignatureValid(parentPrescription)
  if (!signatureValid) {
    console.warn(
      `Signature is not valid for Bundle: ${messageRoot.PORX_IN020101SM31.id._attributes.root}`
    )
  }
}

function warnIfDigestDoesNotMatchPrescription(messageRoot: ElementCompact): void {
  // eslint-disable-next-line max-len
  const sendMessagePayload = messageRoot.PORX_IN020101SM31 as hl7V3.SendMessagePayload<hl7V3.ParentPrescriptionRoot>
  const parentPrescription = sendMessagePayload.ControlActEvent.subject.ParentPrescription
  const digestMatches = verifySignatureDigestMatchesPrescription(parentPrescription)
  if (!digestMatches) {
    console.warn(`Digest did not match for Bundle: ${messageRoot.PORX_IN020101SM31.id._attributes.root}`)
  }
}
