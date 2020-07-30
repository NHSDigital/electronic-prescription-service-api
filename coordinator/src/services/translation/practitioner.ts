import * as fhir from "../../model/fhir-resources"
import {PractitionerRole, Provenance} from "../../model/fhir-resources"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import {convertName, convertTelecom} from "./demographics"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import {
    convertIsoStringToDateTime,
    getExtensionForUrl,
    getIdentifierValueForSystem,
    getResourcesOfType,
    onlyElement,
    resolveReference
} from "./common"
import * as XmlJs from "xml-js"
import * as core from "../../model/hl7-v3-datatypes-core"
import {convertOrganization} from "./organization"

export function convertAuthor(
    fhirBundle: fhir.Bundle,
    fhirFirstMedicationRequest: fhir.MedicationRequest,
    convertPractitionerRoleFn = convertPractitionerRole
): prescriptions.Author {
    const hl7V3Author = new prescriptions.Author()
    hl7V3Author.time = convertIsoStringToDateTime(fhirFirstMedicationRequest.authoredOn)
    hl7V3Author.signatureText = convertSignatureText(fhirBundle, fhirFirstMedicationRequest.requester)
    const fhirAuthorPractitionerRole = resolveReference(fhirBundle, fhirFirstMedicationRequest.requester)
    hl7V3Author.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirAuthorPractitionerRole)
    return hl7V3Author
}

export function convertResponsibleParty(
    fhirBundle: fhir.Bundle,
    fhirMedicationRequest: fhir.MedicationRequest,
    convertPractitionerRoleFn = convertPractitionerRole
): prescriptions.ResponsibleParty {
    const responsibleParty = new prescriptions.ResponsibleParty()
    const fhirResponsibleParty = getExtensionForUrl(fhirMedicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner") as fhir.ReferenceExtension<PractitionerRole>
    const fhirResponsiblePartyPractitionerRole = resolveReference(fhirBundle, fhirResponsibleParty.valueReference)
    responsibleParty.AgentPerson = convertPractitionerRoleFn(fhirBundle, fhirResponsiblePartyPractitionerRole)
    return responsibleParty
}

function convertPractitionerRole(fhirBundle: fhir.Bundle, fhirPractitionerRole: fhir.PractitionerRole): peoplePlaces.AgentPerson {
    const fhirPractitioner = resolveReference(fhirBundle, fhirPractitionerRole.practitioner)
    const hl7V3AgentPerson = convertPractitioner(fhirBundle, fhirPractitioner)
    const fhirOrganization = resolveReference(fhirBundle, fhirPractitionerRole.organization)
    hl7V3AgentPerson.representedOrganization = convertOrganization(fhirBundle, fhirOrganization)
    return hl7V3AgentPerson
}

function convertAgentPersonPerson(fhirPractitioner: fhir.Practitioner) {
    const sdsUniqueIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    const id = new codes.SdsUniqueIdentifier(sdsUniqueIdentifier)
    const hl7V3AgentPersonPerson = new peoplePlaces.AgentPersonPerson(id)
    if (fhirPractitioner.name !== undefined) {
        hl7V3AgentPersonPerson.name = fhirPractitioner.name.map(convertName).reduce(onlyElement)
    }
    return hl7V3AgentPersonPerson
}

function convertPractitioner(
    fhirBundle: fhir.Bundle,
    fhirPractitioner: fhir.Practitioner,
    convertAgentPersonPersonFn = convertAgentPersonPerson
): peoplePlaces.AgentPerson {
    const hl7V3AgentPerson = new peoplePlaces.AgentPerson()

    const sdsRoleProfileIdentifier = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    hl7V3AgentPerson.id = new codes.SdsRoleProfileIdentifier(sdsRoleProfileIdentifier)

    const sdsJobRoleCode = getIdentifierValueForSystem(fhirPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-job-role-id")
    hl7V3AgentPerson.code = new codes.SdsJobRoleCode(sdsJobRoleCode)

    if (fhirPractitioner.telecom !== undefined) {
        hl7V3AgentPerson.telecom = fhirPractitioner.telecom.map(convertTelecom)
    }

    hl7V3AgentPerson.agentPerson = convertAgentPersonPersonFn(fhirPractitioner)

    return hl7V3AgentPerson
}

function convertSignatureText(fhirBundle: fhir.Bundle, signatory: fhir.Reference<fhir.PractitionerRole>) {
    const fhirProvenances = getResourcesOfType(fhirBundle, new Provenance())
    const requesterSignatures = fhirProvenances.flatMap(provenance => provenance.signature)
        .filter(signature => signature.who.reference === signatory.reference)
    if (requesterSignatures.length !== 0) {
        const requesterSignature = requesterSignatures.reduce(onlyElement)
        const signatureData = requesterSignature.data
        const decodedSignatureData = Buffer.from(signatureData, "base64").toString("utf-8")
        return XmlJs.xml2js(decodedSignatureData, {compact: true})
    }
    return core.Null.NOT_APPLICABLE
}
