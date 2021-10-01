import {Bundle, ExtensionExtension, StringExtension} from "../models"
import {pageData, resetPageData} from "./state"

export interface APIResponse {
  success: string
  fhirRequest: Bundle
  hl7Request: string
  hl7Response: string
  fhirResponse: Bundle
}

export interface SendAPIResponse extends APIResponse {
  prescriptionId: string
}

export type SendBulkAPIResponse = Array<{prescription_id: string, success: boolean}>

export interface CancelAPIResponse extends APIResponse {
  prescriptionId: string
  prescriber: {
    name: string
    code: string
  }
  canceller: {
    name: string
    code: string
  }
}

export interface ReleaseAPIResponse extends APIResponse {
  prescriptions?: Array<{ id: string }>
}

export class Prescription {
  id: string
  description: string
  message: string
  select: () => void

  constructor(id: string, description: string, message: string) {
    this.id = id
    this.description = description
    this.message = message
    this.select = function() {
      pageData.selectedExampleId = this.id
      pageData.showCustomExampleInput = this.id === "custom"
      resetPageData(pageData.mode)
    }
  }
}

export class Release {
  id: string
  description: string
  select: () => void

  constructor(id: string, description: string) {
    this.id = id
    this.description = description
    this.select = function () {
      pageData.selectedReleaseId = id
      pageData.showCustomPrescriptionIdInput = id === "custom"
      resetPageData(pageData.mode)
    }
  }
}

export class Pharmacy {
  id: string
  name: string
  display: string
  select: () => void

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
    this.display = id === "custom" ? "Custom" : this.id + " - " + this.name
    this.select = function () {
      pageData.selectedPharmacy = id
      pageData.showCustomPharmacyInput = id === "custom"
      resetPageData(pageData.mode)
    }
  }
}

export class PrescriptionAction {
  id: string
  description: string

  constructor(id: string, description: string) {
    this.id = id
    this.description = description
  }
}

export class CancellationReason {
  id: string
  display: string
  select: () => void

  constructor(id: string, display: string) {
    this.id = id
    this.display = display
    this.select = function () {
      pageData.selectedCancellationReasonId = id
      resetPageData(pageData.mode)
    }
  }
}

export class Canceller {
  id: string
  description: string
  type: string
  display: string
  sdsRoleProfileId: string
  sdsUserId: string
  professionalCodeSystem: string
  professionalCodeValue: string
  title: string
  firstName: string
  lastName: string
  select: () => void

  constructor(
    id: string,
    type: string,
    display: string,
    sdsRoleProfileId: string,
    sdsUserId: string,
    professionalCodeSystem: string,
    professionalCodeValue: string,
    title: string,
    firstName: string,
    lastName: string
  ) {
    this.id = id
    this.type = type
    this.display = display
    this.sdsRoleProfileId = sdsRoleProfileId
    this.sdsUserId = sdsUserId
    this.professionalCodeSystem = professionalCodeSystem
    this.professionalCodeValue = professionalCodeValue
    this.title = title
    this.firstName = firstName
    this.lastName = lastName
    this.description =
      id === "same-as-original-author" ? display : `${type} - ${display}`
    this.select = function () {
      pageData.selectedCancellerId = id
      resetPageData(pageData.mode)
    }
  }
}

export interface SoftwareVersion {
  name: string,
  version: string
}

export interface MetadataResponse {
  capabilityStatement: {
    extension: Array<ExtensionExtension<ExtensionExtension<StringExtension>>>
    software: Array<SoftwareVersion>
  }
}
