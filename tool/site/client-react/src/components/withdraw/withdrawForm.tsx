import {SummaryList} from "nhsuk-react-components"
import React from "react"

interface WithdrawFormProps {
  prescriptionId?: string
}

const WithdrawForm: React.FC<WithdrawFormProps> = ({
  prescriptionId
}) => {

  return (
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{prescriptionId}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

export default WithdrawForm
