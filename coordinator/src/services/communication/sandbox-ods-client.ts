import {OdsClient} from "./ods-client"
import {fhir} from "../../../../models/library"

export class SandboxOdsClient implements OdsClient {
  lookupOrganization(): Promise<fhir.Organization> {
    return Promise.resolve({
      resourceType: "Organization",
      identifier: [{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "FTX40"
      }],
      type: [{
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "182"
        }]
      }],
      name: "HEALTHCARE AT HOME",
      telecom: [{
        system: "phone",
        value: "0870 6001540"
      }],
      address: [{
        line: [
          "FIFTH AVENUE",
          "CENTRUM ONE HUNDRED"
        ],
        city: "BURTON-ON-TRENT",
        district: "STAFFORDSHIRE",
        postalCode: "DE14 2WS",
        country: "ENGLAND"
      }]
    })
  }
}
