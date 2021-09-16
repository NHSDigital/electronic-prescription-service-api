import { SimpleQuantity } from ".";
import { fhir } from "..";
import * as common from "./common"

export interface DispenseClaimInformation extends common.Resource {
    resourceType: "Claim"
    identifier: Array<common.Identifier>
    payee: fhir.Payee
    item: DispenseClaimItem // TODO: IG has this down as an array. Not clear why
}

export interface DispenseClaimItem {
    quantity: SimpleQuantity
}
