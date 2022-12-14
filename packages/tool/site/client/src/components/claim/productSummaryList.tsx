import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {StaticProductInfo} from "./claimForm"

const ProductSummaryList: React.FC<StaticProductInfo> = ({
  status,
  quantityDispensed
}) => (
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
)

export default ProductSummaryList
