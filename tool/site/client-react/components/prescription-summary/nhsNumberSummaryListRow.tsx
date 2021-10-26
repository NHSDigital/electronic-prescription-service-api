import {SummaryList} from "nhsuk-react-components"
import * as React from "react"

interface NhsNumberSummaryListRowProps {
  nhsNumber: string
}

export const NhsNumberSummaryListRow = ({nhsNumber}: NhsNumberSummaryListRowProps): JSX.Element => {
  const formattedNhsNumber = `${nhsNumber.substring(0, 3)} ${nhsNumber.substring(3, 6)} ${nhsNumber.substring(6)}`
  return (
    <SummaryList.Row>
      <SummaryList.Key>NHS number</SummaryList.Key>
      <SummaryList.Value>{formattedNhsNumber}</SummaryList.Value>
    </SummaryList.Row>
  )
}
