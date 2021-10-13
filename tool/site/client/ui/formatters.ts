import {Address, HumanName} from "../models/demographics"
import {Annotation, Dosage, MedicationRequest} from "../models/medication-request"
import {CodingExtension} from "../models/extension"
import * as fhirCommon from "../models/common"
import * as fhirExtension from "../models/extension"
import * as rivets from "../../node_modules/rivets/dist/rivets"
import {pageData} from "./state"

rivets.formatters.snomedCode = {
  read: (codings: Array<fhirCommon.Coding>) => {
    return codings.length
      ? codings.filter(function (coding) {
        return coding.system === "http://snomed.info/sct"
      })[0].code
      : ""
  },
  publish: function (value: string, binding: unknown) {
    return binding
  }
}

rivets.formatters.snomedCodeDescription = {
  read: function (codings: Array<fhirCommon.Coding>) {
    return codings.length
      ? codings.filter(function (coding) {
        return coding.system === "http://snomed.info/sct"
      })[0].display
      : ""
  },
  publish: function (value: string, binding: unknown) {
    return binding
  }
}

rivets.formatters.prescriptionEndorsements = function (extensions: Array<fhirExtension.CodeableConceptExtension>) {
  return extensions
    ? extensions
      .filter(
        extension =>
          extension.url ===
          "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement"
      )
      .flatMap(
        prescriptionEndorsement =>
          prescriptionEndorsement.valueCodeableConcept.coding
      )
      .map(coding => coding.code)
      .join(", ")
    : ""
}

rivets.formatters.nhsNumber = function (identifiers: Array<fhirCommon.Identifier>) {
  if (!identifiers) {
    return ""
  }
  const nhsNumber = identifiers.filter(function (identifier) {
    return identifier.system === "https://fhir.nhs.uk/Id/nhs-number"
  })[0].value
  return (
    nhsNumber.toString().substring(0, 3) +
    " " +
    nhsNumber.toString().substring(3, 6) +
    " " +
    nhsNumber.toString().substring(6)
  )
}

rivets.formatters.odsCode = function (identifiers: Array<fhirCommon.Identifier>) {
  return identifiers
    ? identifiers.filter(function (identifier) {
      return (
        identifier.system === "https://fhir.nhs.uk/Id/ods-organization-code"
      )
    })[0].value
    : ""
}

rivets.formatters.titleCase = function (str: string) {
  //TODO length checks
  return str
    ? str.substring(0, 1).toUpperCase() + str.substring(1)
    : ""
}

rivets.formatters.dosageInstruction = function (dosageInstructions: Array<Dosage>) {
  return dosageInstructions ? dosageInstructions[0].text : ""
}

rivets.formatters.showSendButton = function (sendBulkResponse, sendResponse) {
  return sendBulkResponse || sendResponse
}

rivets.formatters.dispenserNotes = function (notes: Array<Annotation>) {
  return notes
    ?.filter(note => note.text)
    .map(note => note.text)
    .join(". ")
}

rivets.formatters.hasNominatedPharmacy = function (medicationRequests: Array<MedicationRequest>) {
  if (medicationRequests) {
    return medicationRequests.filter( medicationRequest => !!medicationRequest.dispenseRequest.performer).length > 0
  } else {
    return false
  }
}

rivets.formatters.nominatedOds = function (medicationRequests: Array<MedicationRequest>) {
  return medicationRequests ? medicationRequests[0].dispenseRequest.performer.identifier.value : ""
}

rivets.formatters.pharmacyType = function (medicationRequests: Array<MedicationRequest>) {
  if (medicationRequests) {
    const extension = medicationRequests[0].dispenseRequest.extension?.filter(
      extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType"
    )[0] as CodingExtension
    const code = extension?.valueCoding?.code

    if (code === "P1") {
      return "Other (e.g. Community Pharmacy)"
    } else if (code === "P2") {
      return "Appliance Contractor"
    } else if (code === "P3") {
      return "Dispensing Doctor"
    } else if (code === "0004") {
      return "None"
    } else {
      return ""
    }
  }
}

rivets.formatters.fullName = getFullNameFn()

rivets.formatters.fullAddress = function (address: Address) {
  return concatenateIfPresent([
    ...address.line,
    address.city,
    address.district,
    address.state,
    address.postalCode,
    address.country
  ])
}

rivets.formatters.isProd = function (environment: string) {
  return environment === "prod"
}
rivets.formatters.isLogin = function (mode: string) {
  return mode === "login"
}
rivets.formatters.isHome = function (mode: string) {
  return mode === "home"
}
rivets.formatters.isLoad = function (mode: string) {
  return mode === "load"
}
rivets.formatters.isEdit = function (mode: string) {
  return mode === "edit"
}
rivets.formatters.isSign = function (mode: string) {
  return mode === "sign"
}
rivets.formatters.isVerify = function (mode: string) {
  return mode === "verify"
}
rivets.formatters.isSend = function (mode: string) {
  return mode === "send"
}
rivets.formatters.isCancel = function (mode: string) {
  return mode === "cancel"
}
rivets.formatters.isRelease = function (mode: string) {
  return mode === "release"
}
rivets.formatters.isDispense = function (mode: string) {
  return mode === "dispense"
}
rivets.formatters.isClaim = function (mode: string) {
  return mode === "claim"
}
rivets.formatters.showPharmacyList = function (mode: string) {
  return mode === "edit" || mode === "release"
}

rivets.formatters.joinWithSpaces = function (input: Array<string> | string) {
  return Array.isArray(input) ? input.join(" ") : input ?? ""
}

rivets.formatters.appendPageMode = function (string: string) {
  return string + pageData.mode
}

rivets.formatters.displayEnvironment = function (environment: string) {
  if (environment === "prod") {
    return "Production"
  } else if (environment === "internal-qa") {
    return "Integration (Preview)"
  } else if (environment === "int") {
    return "Integration"
  } else if (environment === "internal-dev") {
    return "Development"
  } else if (environment.endsWith("-sandbox")) {
    return "Sandbox"
  } else {
    return environment
  }
}

rivets.formatters.json = function (json: Record<string, unknown>) {
  if (!json) {
    return json
  }
  return JSON.stringify(json, undefined, 2)
}

rivets.formatters.downloadJson = function (json: Record<string, unknown>) {
  if (!json) {
    return json
  }
  const encoded_json = encodeURI(rivets.formatters.json(json))
  return `data:application/json,${encoded_json}`
}

rivets.formatters.xml = function (xml: string) {
  if (!xml) {
    return xml
  }
  xml = xml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return xml
}

rivets.formatters.downloadXml = function (xml: string) {
  if (!xml) {
    return xml
  }
  // component includes '#' which is present in xml
  const encoded_xml = encodeURIComponent(xml)
  return `data:application/xml,${encoded_xml}`
}

export function getFullNameFn(): any {
  return function (name: HumanName) {
    if (!name) {
      return ""
    }
    if (name.text) {
      return name.text
    }
    return concatenateIfPresent([
      toUpperCaseIfPresent(name.family),
      // In the absence of other information, just choose the first one?
      name.given[0],
      surroundWithParenthesesIfPresent(name.prefix),
      surroundWithParenthesesIfPresent(name.suffix)
    ])
  }
}

function concatenateIfPresent(fields: Array<string>) {
  return fields.filter(Boolean).reduce(function (currentValues, valuesToAdd) {
    return currentValues.concat(valuesToAdd)
  }, [])
}

function surroundWithParenthesesIfPresent(fields: Array<string>) {
  if (fields) {
    return `${fields.map(field => `(${field})`).join(" ")}`
  } else {
    return ""
  }
}

function toUpperCaseIfPresent(field: string) {
  if (field) {
    return field.toUpperCase()
  } else {
    return field
  }
}
