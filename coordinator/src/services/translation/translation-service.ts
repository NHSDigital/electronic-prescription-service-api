import * as XmlJs from 'xml-js'
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as core from "../../model/hl7-v3-datatypes-core"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import * as fhir from "../../model/fhir-resources"
import * as crypto from "crypto-js"
import {createSendMessagePayload} from "./send-message-payload";
import {namespacedCopyOf, writeXmlStringCanonicalized} from "./xml";
import {convertParentPrescription} from "./parent-prescription";
import {getIdentifierValueForSystem} from "./common";

export function convertFhirMessageToHl7V3ParentPrescriptionMessage(fhirMessage: fhir.Bundle): string {
    const root = {
        _declaration: new XmlDeclaration(),
        PORX_IN020101UK31: namespacedCopyOf(createParentPrescriptionSendMessagePayload(fhirMessage))
    }
    return writeXmlStringCanonicalized(root)
}

export function createParentPrescriptionSendMessagePayload(fhirBundle: fhir.Bundle): core.SendMessagePayload<prescriptions.ParentPrescriptionRoot> {
    const messageId = getIdentifierValueForSystem([fhirBundle.identifier], "https://tools.ietf.org/html/rfc4122")
    const parentPrescription = convertParentPrescription(fhirBundle)
    const parentPrescriptionRoot = new prescriptions.ParentPrescriptionRoot(parentPrescription)
    const interactionId = codes.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
    const authorAgentPerson = parentPrescription.pertinentInformation1.pertinentPrescription.author.AgentPerson
    return createSendMessagePayload(messageId, interactionId, authorAgentPerson, parentPrescriptionRoot)
}

export function convertFhirMessageToSignedInfoMessage(fhirMessage: fhir.Bundle): string {
    const parentPrescription = convertParentPrescription(fhirMessage)
    const fragmentsToBeHashed = extractSignatureFragments(parentPrescription);
    const fragmentsToBeHashedStr = writeXmlStringCanonicalized(fragmentsToBeHashed);
    const digestValue = crypto.SHA1(fragmentsToBeHashedStr).toString(crypto.enc.Base64)
    const signedInfo = createSignedInfo(digestValue)
    const xmlString = writeXmlStringCanonicalized(signedInfo)
    const parameters = new fhir.Parameters([
        {
            name: "message-digest",
            valueString: xmlString
        }
    ])
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
