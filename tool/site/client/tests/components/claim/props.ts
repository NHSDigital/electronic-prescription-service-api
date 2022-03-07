import {ClaimFormValues, StaticProductInfo} from "../../../src/components/claim/claimForm"
import {getInitialValues} from "../../../src/pages/claimPage"

export const staticProductInfo: StaticProductInfo = {
  id: "e428bb15-6504-4ce5-856f-0c00d6d79944",
  name: "Methotrexate 10mg/0.2ml solution for injection pre-filled syringes",
  status: "Dispensed",
  quantityDispensed: "1 pre-filled disposable injection"
}

export const noPriorClaimInitialValues = getInitialValues([staticProductInfo])

export const priorClaimInitialValues: ClaimFormValues = {
  products: [{
    ...staticProductInfo,
    patientPaid: true,
    endorsements: [{code: "BB", supportingInfo: "Broken Bulk"}]
  }],
  exemption: {
    code: "NDEC",
    evidenceSeen: true
  }
}
