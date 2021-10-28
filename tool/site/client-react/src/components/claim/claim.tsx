import {Button, Form, Label} from "nhsuk-react-components"
import * as React from "react"
import {useState} from "react"
import dispenserEndorsementCodings from "../reference-data/dispenserEndorsementCodings"
import ClaimExemptionStatus, {ExemptionInfo} from "./claimExemptionStatus"
import ClaimDispensedProduct, {DispensedProductInfo, StaticDispensedProductInfo} from "./claimDispensedProduct"

interface ClaimProps {
  dispensedProducts: Array<StaticDispensedProductInfo>
}

const Claim: React.FC<ClaimProps> = ({
  dispensedProducts
}) => {
  const initialExemptionInfo = {
    exemptionStatus: "0001",
    evidenceSeen: false
  }
  const [exemptionInfo, setExemptionInfo] = useState(initialExemptionInfo)
  const exemptionInfoChanged = (newValue: Partial<ExemptionInfo>) => setExemptionInfo(prevState => {
    const newState = {...prevState}
    Object.assign(newState, newValue)
    return newState
  })

  const initialDispensedProductInfo = Object.fromEntries(dispensedProducts.map(product =>
    [product.id, {patientPaid: false, endorsements: []} as DispensedProductInfo]
  ))
  const [dispensedProductInfo, setDispensedProductInfo] = useState(initialDispensedProductInfo)
  const dispensedProductInfoChanged = (id: string, newValue: Partial<DispensedProductInfo>) => setDispensedProductInfo(prevState => {
    const newState = {...prevState}
    Object.assign(newState[id], newValue)
    return newState
  })

  const addEndorsement = (id: string) => setDispensedProductInfo(prevState => {
    const newState = {...prevState}
    newState[id].endorsements.push({
      code: dispenserEndorsementCodings[0].code,
      supportingInfo: ""
    })
    return newState
  })
  const removeEndorsement = (id: string, index: number) => setDispensedProductInfo(prevState => {
    const newState = {...prevState}
    newState[id].endorsements.splice(index, 1)
    return newState
  })

  const handleSubmit = event => {
    event.preventDefault()
    console.log(JSON.stringify(exemptionInfo))
    console.log(JSON.stringify(dispensedProductInfo))
    //TODO - build claim, post to server
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Label isPageHeading>Claim for Dispensed Medication</Label>
      {dispensedProducts.map(dispensedProduct =>
        <ClaimDispensedProduct
          key={dispensedProduct.id}
          staticInfo={dispensedProduct}
          value={dispensedProductInfo[dispensedProduct.id]}
          callback={dispensedProductInfoChanged}
          addEndorsement={() => addEndorsement(dispensedProduct.id)}
          removeEndorsement={index => removeEndorsement(dispensedProduct.id, index)}
        />
      )}
      <ClaimExemptionStatus value={exemptionInfo} callback={exemptionInfoChanged}/>
      <Button type="submit">Claim</Button>
    </Form>
  )
}

export default Claim
