import * as uuid from "uuid"
import * as rivets from "../../node_modules/rivets/dist/rivets"
import Cookies from "js-cookie"
import {
  Prescription,
  Release,
  CancellationReason,
  Canceller,
  Pharmacy,
  PrescriptionAction,
  SendBulkAPIResponse,
  MetadataResponse,
  SoftwareVersion
} from "./view-models"
import examplePrescriptions from "../data/prescriptions"
import {
  APIResponse,
  SendAPIResponse,
  CancelAPIResponse,
  ReleaseAPIResponse
} from "./view-models"
import {Extension, Parameters} from "../models"
import {makeRequest} from "../api/make-request"

const signResponse: APIResponse = undefined
const sendResponse: SendAPIResponse = undefined
const sendBulkResponse: SendBulkAPIResponse = undefined
const cancelResponse: CancelAPIResponse = undefined
const releaseResponse: ReleaseAPIResponse = undefined
const dispenseResponse: APIResponse = undefined

const errorList: Array<{ message: string }> = undefined

const payloads: Array<string> = []

const validatorPackages: Array<SoftwareVersion> = []

export const pageData = {
  examples: [
    // todo: commented out prescriptions either add missing prescription or fix issues in send
    new Prescription(
      "1",
      "Primary Care - Acute (nominated)",
      examplePrescriptions.PRIMARY_CARE_ACUTE_NOMINATED
    ),
    //new Prescription("2", "Primary Care - Repeat Dispensing (nominated)", PRIMARY_CARE_REPEAT_DISPENSING_NOMINATED),
    new Prescription(
      "3",
      "Primary Care - Repeat Prescribing (nominated)",
      examplePrescriptions.PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED
    ),
    new Prescription(
      "4",
      "Secondary Care - Acute (nominated)",
      examplePrescriptions.SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED
    ),
    new Prescription(
      "5",
      "Secondary Care - Acute",
      examplePrescriptions.SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED
    ),
    new Prescription("6",
      "Secondary Care - Repeat Dispensing (nominated)",
      examplePrescriptions.SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED),
    //new Prescription(.., SECONDARY_CARE_REPEAT_PRESCRIBING_NOMINATED),
    new Prescription(
      "8",
      "Homecare - Acute (nominated)",
      examplePrescriptions.HOMECARE_ACUTE_NOMINATED
    ),
    //new Prescription("9", "Homecare - Repeat Dispensing (nominated)", HOMECARE_REPEAT_DISPENSING_NOMINATED),
    //new Prescription("10", "Homecare - Repeat Prescribing (nominated)", HOMECARE_REPEAT_PRESCRIBING_NOMINATED),
    new Prescription("custom", "Custom", null)
  ],
  releases: [
    new Release("all", "All nominated"),
    new Release("prescriptionId", "By Prescription ID"),
    new Release("custom", "Custom")
  ],
  pharmacies: [
    new Pharmacy("VNFKT", "FIVE STAR HOMECARE LEEDS LTD"),
    new Pharmacy("YGM1E", "MBBM HEALTHCARE TECHNOLOGIES LTD"),
    new Pharmacy("custom", "Custom")
  ],
  actions: [
    new PrescriptionAction("", ""),
    new PrescriptionAction("cancel", "Cancel")
  ],
  reasons: [
    new CancellationReason("0001", "Prescribing Error"),
    new CancellationReason("0002", "Clinical contra-indication"),
    new CancellationReason("0003", "Change to medication treatment regime"),
    new CancellationReason("0004", "Clinical grounds"),
    new CancellationReason("0005", "At the Patient's request"),
    new CancellationReason("0006", "At the Pharmacist's request"),
    new CancellationReason("0007", "Notification of Death"),
    new CancellationReason("0008", "Patient deducted - other reason"),
    new CancellationReason("0009", "Patient deducted - registered with new practice")
  ],
  cancellers: [
    new Canceller(
      "same-as-original-author",
      "",
      "Use original author",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ),
    new Canceller(
      "R8006",
      "Admin",
      "Medical Secetary Access Role",
      "212304192555",
      "555086718101",
      "https://fhir.hl7.org.uk/Id/professional-code",
      "unknown",
      "MS",
      "Medical",
      "Secetary"
    )
  ],
  environment: "prod",
  mode: "home",
  signature: "",
  baseUrl: "",
  loggedIn: Cookies.get("Access-Token-Set") === "true",
  showCustomExampleInput: false,
  showCustomPharmacyInput: false,
  selectedExampleId: "1",
  selectedCancellationReasonId: "0001",
  selectedPharmacy: "",
  showCustomPrescriptionIdInput: false,
  showCustomReleaseInput: false,
  selectedCancellerId: "same-as-original-author",
  selectedReleaseId: "all",
  prescriptionId: new URLSearchParams(window.location.search).get(
    "prescription_id"
  ),
  previous_prescription_id: "id",
  next_prescription_id: "id",
  prescription: {},
  signResponse: signResponse,
  sendResponse: sendResponse,
  sendBulkResponse: sendBulkResponse,
  cancelResponse: cancelResponse,
  releaseResponse: releaseResponse,
  dispenseResponse: dispenseResponse,
  errorList: errorList,
  payloads: payloads,
  validatorPackages: validatorPackages,
  clipboardAvailable: !!navigator.clipboard
}

export function bindPageData(): void {
  rivets.bind(document.getElementById("main-content"), pageData)
}

export function resetPageData(pageMode: string): void {
  pageData.mode = pageMode
  pageData.errorList = null
  pageData.sendResponse = null
  pageData.sendBulkResponse = null
  pageData.signResponse = null
  pageData.cancelResponse = null
  pageData.showCustomExampleInput =
    pageMode === "load" ? pageData.selectedExampleId === "custom" : false
  pageData.showCustomPharmacyInput =
    pageMode === "edit" || pageMode === "release"
      ? pageData.selectedPharmacy === "custom"
      : false
  pageData.showCustomPrescriptionIdInput =
    pageMode === "release" ? pageData.selectedReleaseId === "prescriptionId" : false
  pageData.showCustomReleaseInput =
      pageMode === "release" ? pageData.selectedReleaseId === "custom" : false
  pageData.releaseResponse = null
  pageData.dispenseResponse = null
  pageData.selectedPharmacy =
    pageMode === "edit" || pageMode === "release"
      ? pageData.selectedPharmacy ?? "VNFKT"
      : null
  if (pageData.mode === "sign") {
    pageData.previous_prescription_id = Cookies.get("Previous-Prescription-Id")
    pageData.next_prescription_id = Cookies.get("Next-Prescription-Id")
  }
}

export function resetErrors(): void {
  pageData.errorList = undefined
}

export function parseMetadataResponse(): Array<SoftwareVersion> {
  const metadataResponse: MetadataResponse = makeRequest(
    "GET",
    `${pageData.baseUrl}metadata`
  )

  const softwareVersions: Array<SoftwareVersion> = []

  const software = metadataResponse.capabilityStatement.software[0]
  const epsPackage = {name: software.name, version: software.version}

  softwareVersions.push(epsPackage)

  const apiDefinitionExtension = getExtensionForUrl(
    metadataResponse.capabilityStatement.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-NHSDigital-APIDefinition"
  )
  const packageExtensions = getExtensionsForUrl(apiDefinitionExtension.extension, "implementationGuide")
  packageExtensions.forEach(packageExtension => {
    const packageName = getExtensionForUrl(packageExtension.extension, "name").valueString
    const packageVersion = getExtensionForUrl(packageExtension.extension, "version").valueString
    softwareVersions.push({name: packageName, version: packageVersion})
  })

  return softwareVersions
}

function getExtensionsForUrl<T extends Extension>(extensions: Array<T>, url: string) {
  return extensions.filter(extension => extension.url === url)
}

function getExtensionForUrl<T extends Extension>(extensions: Array<T>, url: string) {
  const matchingExtensions = getExtensionsForUrl<T>(extensions, url)
  if (matchingExtensions.length === 1) {
    return matchingExtensions[0]
  } else {
    addError("Failed to parse FHIR message")
  }
}

export function addError(message: string): void {
  if (pageData.errorList === undefined || pageData.errorList === null) {
    pageData.errorList = []
  }
  pageData.errorList.push({
    message: message
  })
}

export function getReleaseRequest(): Parameters {
  if (pageData.selectedReleaseId === "custom") {
    return JSON.parse((document.getElementById("custom-release-textarea") as HTMLInputElement).value)
  }
  const parametersRelease: Parameters = {
    "resourceType": "Parameters",
    "id": uuid.v4(),
    "parameter": [
      {
        "name": "owner",
        "valueIdentifier": {"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": getOdsCode()}
      },
      {
        "name": "status",
        "valueCode": "accepted"
      }
    ]
  }

  if (pageData.selectedReleaseId === "prescriptionId") {
    const prescriptionId = (document.getElementById("prescription-id-input") as HTMLInputElement).value
    parametersRelease.parameter.push({
      "name": "group-identifier",
      "valueIdentifier": {
        "system": "https://fhir.nhs.uk/Id/prescription-order-number",
        "value": prescriptionId
      }
    })
  }
  return parametersRelease
}

export function getOdsCode(): string {
  const isCustom = pageData.selectedPharmacy === "custom"
  const customOdsCode = (document.getElementById("pharmacy-input") as HTMLInputElement).value
  if (isCustom && !customOdsCode) {
    addError("Unable to read custom ods code")
  }
  return isCustom ? customOdsCode : pageData.selectedPharmacy
}
