import {Extension} from "fhir/r4"
import {pageData} from "./state"

export class Prescription {
  id: string
  description: string
  messageFn: (baseUrl: string) => string
  select: () => void

  constructor(id: string, description: string, getMessageFn: (baseUrl: string) => string) {
    this.id = id
    this.description = description
    this.messageFn = getMessageFn
    this.select = function() {
      pageData.selectedExampleId = this.id
      pageData.showCustomExampleInput = this.id === "custom"
    }
  }
}

export interface SoftwareVersion {
  name: string,
  version: string
}

export interface MetadataResponse {
  capabilityStatement: {
    extension: Array<{url: string, extension: Extension[]}>
    software: Array<SoftwareVersion>
  }
}
