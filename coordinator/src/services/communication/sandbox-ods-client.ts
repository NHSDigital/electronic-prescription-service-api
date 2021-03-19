import {OdsClient} from "./ods-client"
import * as fhir from "../../models/fhir"
import {getIdentifierValueForSystem} from "../translation/common"
import * as odsResponses from "../../models/sandbox/ods-responses"

const ODS_ORGANIZATIONS = new Map(
  [
    odsResponses.ORGANIZATION_FH542_COMMUNITY_PHARMACY,
    odsResponses.ORGANIZATION_FTX40_HOMECARE,
    odsResponses.ORGANIZATION_T1450_NHS_BSA,
    odsResponses.ORGANIZATION_VNE51_HOMECARE
  ].map(org => [
    getIdentifierValueForSystem(
      org.identifier,
      "https://fhir.nhs.uk/Id/ods-organization-code",
      "Organization.identifier"
    ),
    org
  ])
)

export class SandboxOdsClient implements OdsClient {
  lookupOrganization(odsCode: string): Promise<fhir.Organization> {
    return Promise.resolve(ODS_ORGANIZATIONS.get(odsCode) ?? null)
  }
}
