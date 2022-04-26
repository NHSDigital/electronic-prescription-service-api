import * as React from "react"
import {CrossIcon, Label, SummaryList, TickIcon} from "nhsuk-react-components"
import {SendResultDetail} from "../../pages/sendPage"
import MessageExpanders from "../messageExpanders"
import PrescriptionActions from "../common/prescriptionActions"
import BackButton from "../common/backButton"
import ButtonList from "../common/buttonList"

interface ResultDetailProps {
  sendResultDetail: SendResultDetail
}

export const ResultDetail: React.FC<ResultDetailProps> = ({sendResultDetail}) => {
  return (
    <>
      <Label isPageHeading>Send Result {sendResultDetail.success ? <TickIcon/> : <CrossIcon/>}</Label>
      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{sendResultDetail.prescription_id}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <PrescriptionActions prescriptionId={sendResultDetail.prescription_id} cancel release view/>
      <MessageExpanders
        fhirRequest={sendResultDetail.request}
        hl7V3Request={sendResultDetail.request_xml}
        fhirResponse={sendResultDetail.response}
        hl7V3Response={sendResultDetail.response_xml}
      />
      <ButtonList>
        <BackButton/>
      </ButtonList>
    </>
  )
}
