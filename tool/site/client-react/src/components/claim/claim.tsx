import {Button, Form, Label} from "nhsuk-react-components"
import * as React from "react"
import {useState} from "react"
import dispenserEndorsementCodings from "../reference-data/dispenserEndorsementCodings"
import ClaimExemptionStatus, {ExemptionInfo} from "./claimExemptionStatus"
import ClaimDispensedProduct, {DispensedProductInfo, StaticDispensedProductInfo} from "./claimDispensedProduct"
import {DeepPartial, mergeState} from "./stateHelpers"

const INITIAL_EXEMPTION_INFO: ExemptionInfo = {
  exemptionStatus: "0001",
  evidenceSeen: false
}

const INITIAL_DISPENSED_PRODUCT_INFO: DispensedProductInfo = {
  patientPaid: false,
  endorsements: []
}

interface ClaimProps {
  dispensedProducts: Array<StaticDispensedProductInfo>
}

const Claim: React.FC<ClaimProps> = ({
  dispensedProducts
}) => {
  const [exemptionInfo, setExemptionInfo] = useState(INITIAL_EXEMPTION_INFO)
  const updateExemptionInfo = createStateUpdater(setExemptionInfo)

  const initialDispensedProductInfoMap: DispensedProductInfoMap = Object.fromEntries(
    dispensedProducts.map(product => [product.id, INITIAL_DISPENSED_PRODUCT_INFO])
  )
  const [dispensedProductInfoMap, setDispensedProductInfoMap] = useState(initialDispensedProductInfoMap)
  const updateDispensedProductInfoMap = createStateUpdater(setDispensedProductInfoMap)

  const addEndorsement = (id: string) => setDispensedProductInfoMap(prevState => {
    const newState = {...prevState}
    newState[id].endorsements.push({
      code: dispenserEndorsementCodings[0].code,
      supportingInfo: ""
    })
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
    //TODO - build claim, post to server
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Label isPageHeading>Claim for Dispensed Medication</Label>
      {dispensedProducts.map(dispensedProduct =>
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

function createStateUpdater<T>(stateSetter: React.Dispatch<React.SetStateAction<T>>) {
  return (newValue: DeepPartial<T>) => stateSetter(prevState => mergeState(prevState, newValue))
}

export interface DispensedProductInfoMap {
  [key: string]: DispensedProductInfo
}

export default Claim
