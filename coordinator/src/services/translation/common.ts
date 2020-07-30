import * as fhir from "../../model/fhir-resources"
import {Extension} from "../../model/fhir-resources"
import moment from "moment"
import * as core from "../../model/hl7-v3-datatypes-core"

export function getResourcesOfType<T extends fhir.Resource>(fhirBundle: fhir.Bundle, type: T): Array<T> {
    const typeGuard = (resource: fhir.Resource): resource is T => resource.resourceType === type.resourceType
    return fhirBundle.entry
        .map(entry => entry.resource)
        .filter(typeGuard)
}

export function getResourceForFullUrl(fhirBundle: fhir.Bundle, resourceFullUrl: string): fhir.Resource {
    return fhirBundle.entry
        .filter(entry => entry.fullUrl === resourceFullUrl)
        .reduce(onlyElement)
        .resource
}

export function resolveReference<T extends fhir.Resource>(bundle: fhir.Bundle, reference: fhir.Reference<T>): T {
    return getResourceForFullUrl(bundle, reference.reference) as T
}

export function getIdentifierValueForSystem(identifier: Array<fhir.Identifier>, system: string): string {
    return identifier
        .filter(identifier => identifier.system === system)
        .reduce(onlyElement)
        .value
}

export function getCodingForSystem(coding: Array<fhir.Coding>, system: string): fhir.Coding {
    return coding
        .filter(coding => coding.system === system)
        .reduce(onlyElement)
}

export function getExtensionForUrl(extensions: Array<fhir.Extension>, url: string): Extension {
    return extensions
        .filter(extension => extension.url === url)
        .reduce(onlyElement)
}

export function getCodeableConceptCodingForSystem(codeableConcept: Array<fhir.CodeableConcept>, system: string): fhir.Coding {
    const coding = codeableConcept
        .flatMap(codeableConcept => codeableConcept.coding)
    return getCodingForSystem(coding, system)
}

export function convertMomentToDateTime(dateTime: moment.Moment): core.Timestamp {
    const hl7V3DateTimeStr = dateTime.format("YYYYMMDDHHmmss")
    return new core.Timestamp(hl7V3DateTimeStr)
}

export function convertIsoStringToDateTime(isoDateTimeStr: string): core.Timestamp {
    const dateTime = moment.utc(isoDateTimeStr, moment.ISO_8601, true)
    return convertMomentToDateTime(dateTime)
}

export function convertMomentToDate(dateTime: moment.Moment): core.Timestamp {
    const hl7V3DateStr = dateTime.format("YYYYMMDD")
    return new core.Timestamp(hl7V3DateStr)
}

export function convertIsoStringToDate(isoDateStr: string): core.Timestamp {
    const dateTime = moment.utc(isoDateStr, moment.ISO_8601, true)
    return convertMomentToDate(dateTime)
}

//TODO - replace usage of this method with something which returns more user-friendly error messages
export function onlyElement<T>(previousValue: T, currentValue: T, currentIndex: number, array: T[]): never {
    throw TypeError("Expected 1 element but got " + array.length + ": " + JSON.stringify(array))
}
