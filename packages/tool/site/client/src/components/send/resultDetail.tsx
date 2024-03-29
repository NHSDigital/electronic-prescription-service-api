import * as React from "react"
import {Label, SummaryList} from "nhsuk-react-components"
import {SendResultDetail} from "../../pages/sendPage"
import MessageExpanders from "../messageExpanders"
import PrescriptionActions from "../common/prescriptionActions"
import BackButton from "../common/backButton"
import ButtonList from "../common/buttonList"
import SuccessOrFail from "../common/successOrFail"

interface ResultDetailProps {
  sendResultDetail: SendResultDetail
}

export const ResultDetail: React.FC<ResultDetailProps> = ({sendResultDetail}) => {
  return (
    <>
      <Label isPageHeading>Send Result {<SuccessOrFail condition={!!sendResultDetail.success}/>}</Label>
      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{sendResultDetail.prescription_id}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <PrescriptionActions prescriptionId={sendResultDetail.prescription_id} cancel release statusView/>
      <MessageExpanders
        fhirRequest={sendResultDetail.request}
        hl7V3Request={sendResultDetail.request_xml}
        hl7V3Response={sendResultDetail.response_xml}
        fhirResponse={sendResultDetail.response}
      />
      <ButtonList>
        <BackButton/>
      </ButtonList>
    </>
  )
}
