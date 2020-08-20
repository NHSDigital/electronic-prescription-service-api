import * as XmlJs from "xml-js"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as core from "../../model/hl7-v3-datatypes-core"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import * as fhir from "../../model/fhir-resources"
import * as crypto from "crypto-js"
import {createSendMessagePayload} from "./send-message-payload"
import {namespacedCopyOf, writeXmlStringCanonicalized, writeXmlStringPretty} from "./xml"
import {convertParentPrescription} from "./parent-prescription"
import {getIdentifierValueForSystem} from "./common"

export function convertFhirMessageToHl7V3ParentPrescriptionMessage(fhirMessage: fhir.Bundle): string {
  const root = {
    _declaration: new XmlDeclaration(),
    PORX_IN020101SM31: namespacedCopyOf(createParentPrescriptionSendMessagePayload(fhirMessage))
  }
  return writeXmlStringPretty(root)
}

export function createParentPrescriptionSendMessagePayload(fhirBundle: fhir.Bundle): core.SendMessagePayload<prescriptions.ParentPrescriptionRoot> {
  const messageId = getIdentifierValueForSystem([fhirBundle.identifier], "https://tools.ietf.org/html/rfc4122")
  const parentPrescription = convertParentPrescription(fhirBundle)
  const parentPrescriptionRoot = new prescriptions.ParentPrescriptionRoot(parentPrescription)
  const interactionId = codes.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
  return createSendMessagePayload(messageId, interactionId, fhirBundle, parentPrescriptionRoot)
}

export function convertFhirMessageToSignedInfoMessage(fhirMessage: fhir.Bundle): string {
  const parentPrescription = convertParentPrescription(fhirMessage)
  const fragmentsToBeHashed = extractSignatureFragments(parentPrescription)
  const fragmentsToBeHashedStr = writeXmlStringCanonicalized(fragmentsToBeHashed)
  const digestValue = crypto.SHA1(fragmentsToBeHashedStr).toString(crypto.enc.Base64)
  const signedInfo = createSignedInfo(digestValue)
  const xmlString = writeXmlStringCanonicalized(signedInfo)
  const base64Payload = Buffer.from(xmlString).toString("base64")
  const parameters = createParameters(base64Payload)
  return JSON.stringify(parameters, null, 2)
}

export function extractSignatureFragments(parentPrescription: prescriptions.ParentPrescription): XmlJs.ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const fragments = []

  fragments.push({
    time: namespacedCopyOf(pertinentPrescription.author.time),
    id: namespacedCopyOf(pertinentPrescription.id[0])
  })

  fragments.push({
    AgentPerson: namespacedCopyOf(pertinentPrescription.author.AgentPerson)
  })

  fragments.push({
    recordTarget: namespacedCopyOf(parentPrescription.recordTarget)
  })

  pertinentPrescription.pertinentInformation2.forEach(
    pertinentInformation2 => fragments.push({
      pertinentLineItem: namespacedCopyOf(pertinentInformation2.pertinentLineItem)
    })
  )

  return {
    FragmentsToBeHashed: {
      Fragment: fragments
    }
  } as XmlJs.ElementCompact
}

function createSignedInfo(digestValue: string): XmlJs.ElementCompact {
  return {
    SignedInfo: {
      CanonicalizationMethod: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#"),
      SignatureMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#rsa-sha1"),
      Reference: {
        Transforms: {
          Transform: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#")
        },
        DigestMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#sha1"),
        DigestValue: digestValue
      }
    }
  } as XmlJs.ElementCompact
}

function createBase64Display(): string {
  const hardCodedResponse = "####Patient**NHS Number**: 945 374 0586**Name**: PENSON, HEADLEY TED (Mr)**Date of Birth**: 1977-03-27**Address (Home)**:  10 CRECY CLOSE,  DERBY,  DE22 3JU####Author**Name**: CHANDLER, ANDREW**Telecom (Work)**: 01945700223####Organisation**Name**: PARSON DROVE SURGERY**Telecom (Work)**: 01945700223**Address (Work)**:  240 MAIN ROAD,  PARSON DROVE,  WISBECH,  CAMBRIDGESHIRE,  PE13 4JA####Medication Requested|Name|Dose|Quantity|Unit||----|----|--------|----||Microgynon 30 tablets (Bayer Plc)|As Directed|63|tabletetc."
  return Buffer.from(hardCodedResponse).toString("base64")
}

function createParameters(base64Payload: string) {
  const parameters: Array<fhir.Parameter> = []
  parameters.push({name: "payload", valueString: base64Payload})
  parameters.push({name: "display", valueString: createBase64Display()})
  parameters.push({name: "algorithm", valueString: "RS1"})
  return new fhir.Parameters(parameters)
}

class AlgorithmIdentifier implements XmlJs.ElementCompact {
    _attributes: {
        Algorithm: string
    }

    constructor(algorithm: string) {
      this._attributes = {
        Algorithm: algorithm
      }
    }
}

class XmlDeclaration {
    _attributes = {
      version: "1.0",
      encoding: "UTF-8"
    }
}
