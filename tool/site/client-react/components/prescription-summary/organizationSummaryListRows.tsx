import {Address} from "fhir/r4"
import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {AddressSummaryListRow} from "./addressSummaryListRow"

interface OrganizationSummaryListRowsProps {
  name: string
  odsCode: string
  address: Address
  parentName: string
  parentOdsCode: string
}

export const OrganizationSummaryListRows: React.FC<OrganizationSummaryListRowsProps> = ({
  name,
  odsCode,
  address,
  parentName,
  parentOdsCode
}) => {
  return (
    <>
      <SummaryList.Row>
        <SummaryList.Key>Organization</SummaryList.Key>
        <SummaryList.Value>{name} ({odsCode})</SummaryList.Value>
      </SummaryList.Row>
      <AddressSummaryListRow address={address}/>
      <SummaryList.Row>
        <SummaryList.Key>Trust / CCG</SummaryList.Key>
        <SummaryList.Value>{parentName} ({parentOdsCode})</SummaryList.Value>
      </SummaryList.Row>
    </>
  )
}
