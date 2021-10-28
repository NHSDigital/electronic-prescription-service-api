import * as React from "react"
import {Fragment} from "react"
import ClaimEndorsement, {EndorsementInfo} from "./claimEndorsement"
import {Button, Checkboxes, Fieldset, SummaryList} from "nhsuk-react-components"
import {DeepPartial, sparseArray} from "./stateHelpers"

export interface StaticDispensedProductInfo {
  id: string,
  productName: string,
  status: string,
  quantityDispensed: string
}

export interface DispensedProductInfo {
  patientPaid: boolean,
  endorsements: Array<EndorsementInfo>
}

interface ClaimDispensedProductProps {
  staticInfo: StaticDispensedProductInfo
  value: DispensedProductInfo
  callback: (dispensedProductInfo: DeepPartial<DispensedProductInfo>) => void
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
  return (
    <Fieldset>
      <Fieldset.Legend size="m">{staticInfo.productName}</Fieldset.Legend>
      <SummaryList noBorder>
        <SummaryList.Row>
          <SummaryList.Key>Status</SummaryList.Key>
          <SummaryList.Value>{staticInfo.status}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Quantity Dispensed</SummaryList.Key>
          <SummaryList.Value>{staticInfo.quantityDispensed}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <Checkboxes>
        <Checkboxes.Box
          id={"patient-paid-" + staticInfo.id}
          checked={value.patientPaid}
          onChange={event => callback({patientPaid: event.target.checked})}
        >
          Patient Paid
        </Checkboxes.Box>
      </Checkboxes>
      {value.endorsements.map((endorsement, index) =>
        <Fragment key={index}>
          <ClaimEndorsement
            index={index}
            value={endorsement}
            callback={newValue => callback({endorsements: sparseArray(index, newValue)})}
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

export default ClaimDispensedProduct
