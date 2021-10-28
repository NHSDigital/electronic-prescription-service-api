import {Button, Checkboxes, Fieldset, Form, Input, Label, Select, SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Fragment, useState} from "react"
import chargeExemptionCodings from "../reference-data/chargeExemptionCodings"
import dispenserEndorsementCodings from "../reference-data/dispenserEndorsementCodings"

//TODO - pass in using props
const dispensedProducts = [
  {
    id: "d97818ca-26e6-4b43-980e-9dbe7cb5743d",
    productName: "Diclofenac potassium 50mg tablets",
    status: "Fully Dispensed",
    quantityDispensed: "28 tablet"
  },
  {
    id: "251e614d-1098-4f5b-a4e0-b5929a9bd808",
    productName: "Morphine 15mg modified-release tablets",
    status: "Fully Dispensed",
    quantityDispensed: "28 tablet"
  }
]

const Claim: React.FC = () => {
  const [exemptionInfo, setExemptionInfo] = useState({
    exemptionStatus: "0001",
    evidenceSeen: false
  })
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

interface StaticDispensedProductInfo {
  id: string,
  productName: string,
  status: string,
  quantityDispensed: string
}

interface DispensedProductInfo {
  patientPaid: boolean,
  endorsements: Array<EndorsementInfo>
}

interface EndorsementInfo {
  code: string
  supportingInfo: string
}

interface ExemptionInfo {
  exemptionStatus: string,
  evidenceSeen: boolean
}

type DispensedProductCallback = (id: string, dispensedProductInfo: Partial<DispensedProductInfo>) => void

type ExemptionStatusCallback = (exemptionInfo: Partial<ExemptionInfo>) => void

type EndorsementCallback = (endorsement: Partial<EndorsementInfo>) => void

interface ClaimDispensedProductProps {
  staticInfo: StaticDispensedProductInfo
  value: DispensedProductInfo
  callback: DispensedProductCallback
  addEndorsement: () => void
  removeEndorsement: (index: number) => void
}

const ClaimDispensedProduct: React.FC<ClaimDispensedProductProps> = ({
  staticInfo,
  value,
  callback,
  addEndorsement,
  removeEndorsement
}) => {
  //TODO - There might be a bug here. Not sure if you're allowed to merge props into state like this.
  const endorsementCallback = (index: number, newValue: Partial<EndorsementInfo>) => {
    const newEndorsements = [...value.endorsements]
    Object.assign(newEndorsements[index], newValue)
    callback(staticInfo.id, {endorsements: newEndorsements})
  }

  return (
    <Fieldset>
      <Fieldset.Legend size="m">{staticInfo.productName}</Fieldset.Legend>
      <SummaryList noBorder>
        <SummaryList.Row>
          <SummaryList.Key>Status</SummaryList.Key>
          <SummaryList.Value>{status}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Quantity Dispensed</SummaryList.Key>
          <SummaryList.Value>{staticInfo.quantityDispensed}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <Checkboxes>
        <Checkboxes.Box
          id="patient-paid"
          checked={value.patientPaid}
          onChange={event => callback(staticInfo.id, {patientPaid: event.target.checked})}
        >
          Patient Paid
        </Checkboxes.Box>
      </Checkboxes>
      {value.endorsements.map((endorsement, index) =>
        <Fragment key={index}>
          <ClaimEndorsement
            index={index}
            value={endorsement}
            callback={newValue => endorsementCallback(index, newValue)}
          />
          <div>
            <Button type="button" onClick={() => removeEndorsement(index)} secondary>Remove Endorsement</Button>
          </div>
        </Fragment>
      )}
      <div>
        <Button type="button" onClick={addEndorsement}>Add Endorsement</Button>
      </div>
    </Fieldset>
  )
}

interface ClaimEndorsementProps {
  index: number
  value: EndorsementInfo
  callback: EndorsementCallback
}

const ClaimEndorsement: React.FC<ClaimEndorsementProps> = ({
  index,
  value,
  callback
}) => {
  return (
    <>
      <Select
        id={"endorsement-code-" + index}
        label={"Endorsement " + (index + 1)}
        value={value.code}
        onChange={event => callback({code: event.target.value})}
      >
        {dispenserEndorsementCodings.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Select>
      <Input
        id={"endorsement-supporting-info-" + index}
        label={"Endorsement " + (index + 1) + " Supporting Information"}
        width={30}
        value={value.supportingInfo}
        onChange={event => callback({supportingInfo: event.target.value})}/>
    </>
  )
}

interface ClaimExemptionStatusProps {
  value: ExemptionInfo
  callback: ExemptionStatusCallback
}

const ClaimExemptionStatus: React.FC<ClaimExemptionStatusProps> = ({
  value,
  callback
}) => {
  return (
    <Fieldset>
      <Fieldset.Legend size="m">Charge Exemption</Fieldset.Legend>
      <Select
        id="exemption-status"
        label="Exemption Status"
        value={value.exemptionStatus}
        onChange={event => callback({exemptionStatus: event.target.value})}
      >
        {chargeExemptionCodings.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Select>
      <Checkboxes>
        <Checkboxes.Box
          id="evidence-seen"
          checked={value.evidenceSeen}
          onChange={event => callback({evidenceSeen: event.target.checked})}
        >
          Evidence Seen
        </Checkboxes.Box>
      </Checkboxes>
    </Fieldset>
  )
}
