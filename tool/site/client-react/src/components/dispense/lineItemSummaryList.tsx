import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {LineItemFormValues} from "./dispenseForm"
import {VALUE_SET_LINE_ITEM_STATUS} from "../../fhir/reference-data/valueSets"

const LineItemSummaryList: React.FC<LineItemFormValues> = ({quantity, priorStatusCode}) => {
  const priorStatusDesc = VALUE_SET_LINE_ITEM_STATUS.find(coding => coding.code === priorStatusCode).display
  return (
    <SummaryList noBorder>
      <SummaryList.Row>
        <SummaryList.Key>Quantity Requested</SummaryList.Key>
        <SummaryList.Value>{quantity}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Prior Status</SummaryList.Key>
        <SummaryList.Value>{priorStatusDesc}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

export default LineItemSummaryList
