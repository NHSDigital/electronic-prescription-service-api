import * as React from "react"
import {Label} from "nhsuk-react-components"
import WithdrawForm from "../components/withdraw/withdrawForm"

interface WithdrawPageProps {
  prescriptionId?: string
}

const WithdrawPage: React.FC<WithdrawPageProps> = ({
  prescriptionId
}) => {
  return (
    <>
      <Label isPageHeading>Withdraw prescription</Label>
      <WithdrawForm prescriptionId={prescriptionId}/>
    </>
  )
}

export default WithdrawPage
