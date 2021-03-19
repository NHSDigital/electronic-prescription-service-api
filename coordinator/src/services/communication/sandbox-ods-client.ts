import {OdsClient} from "./ods-client"
import * as fhir from "../../models/fhir"
import {getIdentifierValueForSystem} from "../translation/common"
import * as odsResponses from "../../models/sandbox/ods-responses"

export class SandboxOdsClient implements OdsClient {
  static responses = [
    odsResponses.ORGANIZATION_FH542_COMMUNITY_PHARMACY,
    odsResponses.ORGANIZATION_FTX40_HOMECARE,
    odsResponses.ORGANIZATION_T1450_NHS_BSA,
    odsResponses.ORGANIZATION_VNE51_HOMECARE
  ]

  static responseMap = new Map(SandboxOdsClient.responses.map(SandboxOdsClient.toMapEntry))

  private static toMapEntry(organization: fhir.Organization): [string, fhir.Organization] {
    return [
      getIdentifierValueForSystem(
        organization.identifier,
        "https://fhir.nhs.uk/Id/ods-organization-code",
        "Organization.identifier"
      ),
      organization
    ]
  }

  lookupOrganization(odsCode: string): Promise<fhir.Organization> {
    return Promise.resolve(SandboxOdsClient.responseMap.get(odsCode) ?? null)
  }
}
