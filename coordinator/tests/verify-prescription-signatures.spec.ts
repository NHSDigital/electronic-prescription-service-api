import {ElementCompact} from "xml-js"
import {readXml} from "../src/services/serialisation/xml"
import {readFileSync} from "fs"
import * as path from "path"
import {fetcher} from "@models"
import {warnIfDigestDoesNotMatchPrescription, warnIfSignatureIsInvalid} from "../src/services/signature-verification";

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
