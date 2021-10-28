import {Button, Checkboxes, Fieldset, Form, Input, InsetText, Label, Select, SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Fragment, useEffect, useState} from "react"
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
  const dispensedProductInfoMap: Map<string, DispensedProductInfo> = new Map()
  let exemptionInfo: ExemptionInfo = {
    exemptionStatus: "0001",
    evidenceSeen: false
  }

  const productStateChanged = (id: string, newDispensedProductInfo: DispensedProductInfo) => {
    dispensedProductInfoMap.set(id, newDispensedProductInfo)
  }

  const exemptionStatusChanged = newExemptionInfo => {
    exemptionInfo = newExemptionInfo
  }

  const handleSubmit = event => {
    event.preventDefault()
    console.log(JSON.stringify(exemptionInfo))
    console.log(JSON.stringify(Array.from(dispensedProductInfoMap.entries())))
    //TODO - build claim, post to server
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Label isPageHeading>Claim for Dispensed Medication</Label>
      {dispensedProducts.map(dispensedProduct =>
        <ClaimDispensedProduct key={dispensedProduct.id} {...dispensedProduct} callback={productStateChanged}/>
      )}
      <ClaimExemptionStatus callback={exemptionStatusChanged}/>
      <Button type="submit">Claim</Button>
    </Form>
  )
}

export default Claim

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

type DispensedProductCallback = (id: string, dispensedProductInfo: DispensedProductInfo) => void

type ExemptionStatusCallback = (exemptionInfo: ExemptionInfo) => void

type EndorsementCallback = (endorsement: EndorsementInfo) => void

interface ClaimDispensedProductProps {
  id: string,
  productName: string,
  status: string,
  quantityDispensed: string
  callback: DispensedProductCallback
}

const ClaimDispensedProduct: React.FC<ClaimDispensedProductProps> = ({
  id,
  productName,
  status,
  quantityDispensed,
  callback
}) => {
  const [patientPaid, setPatientPaid] = useState(false)
  const [endorsements, setEndorsements] = useState<Array<EndorsementInfo>>([])

  const patientPaidChanged = event => {
    const {checked} = event.target
    setPatientPaid(checked)
  }
  const endorsementChanged = (index, newValue) => setEndorsements(prevState => {
    const newState = [...prevState]
    newState[index] = newValue
    return newState
  })
  const addEndorsement = () => setEndorsements(prevState => {
    const newState = [...prevState]
    newState.push({
      code: dispenserEndorsementCodings[0].code,
      supportingInfo: ""
    })
    return newState
  })
  const removeEndorsement = index => setEndorsements(prevState => {
    const newState = [...prevState]
    newState.splice(index, 1)
    return newState
  })

  useEffect(() => callback(id, {patientPaid, endorsements}), [patientPaid, endorsements])

  return (
    <Fieldset>
      <Fieldset.Legend size="m">{productName}</Fieldset.Legend>
      <SummaryList noBorder>
        <SummaryList.Row>
          <SummaryList.Key>Status</SummaryList.Key>
          <SummaryList.Value>{status}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Quantity Dispensed</SummaryList.Key>
          <SummaryList.Value>{quantityDispensed}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <Checkboxes>
        <Checkboxes.Box id="patient-paid" checked={patientPaid} onChange={patientPaidChanged}>
          Patient Paid
        </Checkboxes.Box>
      </Checkboxes>
      {endorsements.map((endorsement, index) =>
        <Fragment key={index}>
          <ClaimEndorsement index={index} value={endorsement} callback={value => endorsementChanged(index, value)}/>
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
  const [code, setCode] = useState(value.code)
  const [supportingInfo, setSupportingInfo] = useState(value.supportingInfo)
  const codeChanged = event => {
    const {value} = event.target
    setCode(value)
  }
  const supportingInfoChanged = event => {
    const {value} = event.target
    setSupportingInfo(value)
  }

  useEffect(() => callback({code, supportingInfo}), [code, supportingInfo])

  return (
    <InsetText>
      <Select
        id={"endorsement-code-" + index}
        label={"Endorsement " + (index + 1)}
        value={code}
        onChange={codeChanged}
      >
        {dispenserEndorsementCodings.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Select>
      <Input
        id={"endorsement-supporting-info-" + index}
        label={"Endorsement " + (index + 1) + " Supporting Information"}
        width={30}
        value={supportingInfo}
        onChange={supportingInfoChanged}/>
    </InsetText>
  )
}

interface ClaimExemptionStatusProps {
  callback: ExemptionStatusCallback
}

const ClaimExemptionStatus: React.FC<ClaimExemptionStatusProps> = ({
  callback
}) => {
  const [exemptionStatus, setExemptionStatus] = useState(chargeExemptionCodings[0].code)
  const [evidenceSeen, setEvidenceSeen] = useState(false)

  const exemptionStatusChanged = event => {
    const {value} = event.target
    setExemptionStatus(value)
  }
  const evidenceSeenChanged = event => {
    const {checked} = event.target
    setEvidenceSeen(checked)
  }

  useEffect(() => callback({exemptionStatus, evidenceSeen}), [exemptionStatus, evidenceSeen])

  return (
    <Fieldset>
      <Fieldset.Legend size="m">Charge Exemption</Fieldset.Legend>
      <Select id="exemption-status" label="Exemption Status" value={exemptionStatus} onChange={exemptionStatusChanged}>
        {chargeExemptionCodings.map(coding =>
          <Select.Option key={coding.code} value={coding.code}>{coding.display}</Select.Option>
        )}
      </Select>
      <Checkboxes>
        <Checkboxes.Box id="evidence-seen" checked={evidenceSeen} onChange={evidenceSeenChanged}>
          Evidence Seen
        </Checkboxes.Box>
      </Checkboxes>
    </Fieldset>
  )
}
