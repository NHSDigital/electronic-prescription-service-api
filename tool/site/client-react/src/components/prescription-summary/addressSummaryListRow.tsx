import {Address} from "fhir/r4"
import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Fragment} from "react"

interface AddressSummaryListRowProps {
  address: Address
}

export const AddressSummaryListRow = ({address}: AddressSummaryListRowProps): JSX.Element => {
  const addressLines = address.line ?? []

  const allAddressLines = [
    ...addressLines,
    address.city,
    address.district,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean)

  const formattedAddress = allAddressLines.map((addressLine, index) => (
    <Fragment key={index}>
      {index > 0 && <br/>}
      {addressLine}
    </Fragment>
  ))

  return (
    <SummaryList.Row>
      <SummaryList.Key>Address</SummaryList.Key>
      <SummaryList.Value>{formattedAddress}</SummaryList.Value>
    </SummaryList.Row>
  )
}
