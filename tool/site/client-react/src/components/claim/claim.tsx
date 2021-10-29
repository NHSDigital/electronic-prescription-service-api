import {Button, Form, Label} from "nhsuk-react-components"
import * as React from "react"
import {useState} from "react"
import dispenserEndorsementCodings from "./reference-data/dispenserEndorsementCodings"
import ClaimExemptionStatus, {ExemptionInfo} from "./claimExemptionStatus"
import ClaimDispensedProduct, {DispensedProductInfo, StaticDispensedProductInfo} from "./claimDispensedProduct"
import {createStateUpdater} from "../stateHelpers"
import {EndorsementInfo} from "./claimEndorsement"
import {MedicationDispense, MedicationRequest, Patient} from "fhir/r4"
import {createClaim, getMedicationDispenseLineItemId} from "./createDispenseClaim"
import {getTaskBusinessStatusExtension} from "../../fhir/customExtensions"

const INITIAL_EXEMPTION_INFO: ExemptionInfo = {
  exemptionStatus: "0001",
  evidenceSeen: false
}

const INITIAL_DISPENSED_PRODUCT_INFO: DispensedProductInfo = {
  patientPaid: false,
  endorsements: []
}

const INITIAL_ENDORSEMENT_INFO: EndorsementInfo = {
  code: dispenserEndorsementCodings[0].code,
  supportingInfo: ""
}

export interface ClaimProps {
  patient: Patient
  medicationRequests: Array<MedicationRequest>
  medicationDispenses: Array<MedicationDispense>
}

const Claim: React.FC<ClaimProps> = ({
  patient,
  medicationRequests,
  medicationDispenses
}) => {
  const [exemptionInfo, setExemptionInfo] = useState(INITIAL_EXEMPTION_INFO)
  const updateExemptionInfo = createStateUpdater(setExemptionInfo)

  const staticDispensedProductInfo = getStaticDispensedProductInfo(medicationDispenses)
  const initialDispensedProductInfoMap: DispensedProductInfoMap = Object.fromEntries(
    staticDispensedProductInfo.map(product => [product.id, INITIAL_DISPENSED_PRODUCT_INFO])
  )
  const [dispensedProductInfoMap, setDispensedProductInfoMap] = useState(initialDispensedProductInfoMap)
  const updateDispensedProductInfoMap = createStateUpdater(setDispensedProductInfoMap)

  const addEndorsement = (id: string) => setDispensedProductInfoMap(prevState => {
    const newState = {...prevState}
    newState[id].endorsements.push(INITIAL_ENDORSEMENT_INFO)
    return newState
  })
  const removeEndorsement = (id: string, index: number) => setDispensedProductInfoMap(prevState => {
    const newState = {...prevState}
    newState[id].endorsements.splice(index, 1)
    return newState
  })

  const handleSubmit = event => {
    event.preventDefault()
    console.log(JSON.stringify(exemptionInfo))
    console.log(JSON.stringify(dispensedProductInfoMap))
    const claim = createClaim(patient, medicationRequests, medicationDispenses, exemptionInfo, dispensedProductInfoMap)
    console.log(JSON.stringify(claim))
    //TODO - post to server
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Label isPageHeading>Claim for Dispensed Medication</Label>
      {staticDispensedProductInfo.map(dispensedProduct =>
        <ClaimDispensedProduct
          key={dispensedProduct.id}
          staticInfo={dispensedProduct}
          value={dispensedProductInfoMap[dispensedProduct.id]}
          callback={newValue => updateDispensedProductInfoMap({[dispensedProduct.id]: newValue})}
          addEndorsement={() => addEndorsement(dispensedProduct.id)}
          removeEndorsement={index => removeEndorsement(dispensedProduct.id, index)}
        />
      )}
      <ClaimExemptionStatus value={exemptionInfo} callback={updateExemptionInfo}/>
      <Button type="submit">Claim</Button>
    </Form>
  )
}

function getStaticDispensedProductInfo(medicationDispenses: Array<MedicationDispense>): Array<StaticDispensedProductInfo> {
  return medicationDispenses.map(medicationDispense => ({
    id: getMedicationDispenseLineItemId(medicationDispense),
    productName: medicationDispense.medicationCodeableConcept.text,
    quantityDispensed: `${medicationDispense.quantity.value} ${medicationDispense.quantity.unit}`,
    status: getTaskBusinessStatusExtension(medicationDispense.extension).valueCoding.display
  }))
}

export interface DispensedProductInfoMap {
  [key: string]: DispensedProductInfo
}

export default Claim
