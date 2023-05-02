import {fhir, hl7V3} from "@models"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common/dateTime"
import {generateResourceId, getFullUrl} from "./common"
import {writeXmlStringCanonicalized} from "../../serialisation/xml"

export async function convertSignatureTextToProvenance(
  author: hl7V3.PrescriptionAuthor, authorFHIRId: string, targetResourceIds: Array<string>
): Promise<fhir.Provenance> {
  const signatureText = author.signatureText
  let canonicalizationMethod = "http://www.w3.org/2001/10/xml-exc-c14n#"
  if ("Signature" in signatureText) {
    const algorithm = signatureText.Signature?.SignedInfo?.CanonicalizationMethod?._attributes?.Algorithm
    if (algorithm) {
      canonicalizationMethod = algorithm
    }
  }
  const canonicalized = await writeXmlStringCanonicalized(signatureText, canonicalizationMethod)
  const encodedSignature = Buffer.from(canonicalized, "utf-8").toString("base64")

  const targets: Array<fhir.Reference<fhir.Resource>> = targetResourceIds.map(targetId => ({
    reference: getFullUrl(targetId)
  }))

  const who: fhir.Reference<fhir.PractitionerRole> = {
    reference: getFullUrl(authorFHIRId)
  }
  return {
    resourceType: "Provenance",
    id: generateResourceId(),
    agent: [{who: who}],
    recorded: convertHL7V3DateTimeToIsoDateTimeString(author.time),
    signature: [{
      who: who,
      when: convertHL7V3DateTimeToIsoDateTimeString(author.time),
      data: encodedSignature,
      type: [{
        code: "1.2.840.10065.1.12.1.1",
        system: "urn:iso-astm:E1762-95:2013"
      }]
    }],
    target: targets
  }
}
