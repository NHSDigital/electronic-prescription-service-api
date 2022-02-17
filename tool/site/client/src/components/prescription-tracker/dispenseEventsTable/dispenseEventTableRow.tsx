import * as React from "react"
import {Details, SummaryList} from "nhsuk-react-components"
import styled from "styled-components"
import {DispenseEventProps} from "./dispenseEventTable"
import {LineItemTable} from "./lineItemTable"

const StyledList = styled(SummaryList)`
  padding: 0px 24px 0px 24px;
`

export const DispenseEventTableRow: React.FC<DispenseEventProps> = ({
  identifier,
  prescriptionStatus,
  eventDate,
  items
}) => {
  return (
    <Details expander>
      <Details.Summary>{eventDate}</Details.Summary>
      <StyledList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{identifier}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Event Date</SummaryList.Key>
          <SummaryList.Value>{eventDate}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Prescription Status</SummaryList.Key>
          <SummaryList.Value>{prescriptionStatus}</SummaryList.Value>
        </SummaryList.Row>
      </StyledList>
      <Details.Text>
        <LineItemTable items={items}/>
      </Details.Text>
    </Details>
  )
}
