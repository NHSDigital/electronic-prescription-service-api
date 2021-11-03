import * as React from "react"
import {Details} from "nhsuk-react-components"
import Pre from "./pre"
import {FhirResource} from "fhir/r4"

interface MessageExpandersProps {
  fhirRequest: FhirResource
  hl7V3Request: string
  fhirResponse: FhirResource
  hl7V3Response: string
}

const MessageExpanders: React.FC<MessageExpandersProps> = ({
  fhirRequest,
  hl7V3Request,
  fhirResponse,
  hl7V3Response
}) => {
  return (
    <Details.ExpanderGroup>
      <Details expander>
        <Details.Summary>Request (FHIR)</Details.Summary>
        <Details.Text>
          <Pre>{JSON.stringify(fhirRequest, null, 2)}</Pre>
        </Details.Text>
      </Details>
      <Details expander>
        <Details.Summary>Request (HL7 V3)</Details.Summary>
        <Details.Text>
          <Pre>{hl7V3Request}</Pre>
        </Details.Text>
      </Details>
      <Details expander>
        <Details.Summary>Response (FHIR)</Details.Summary>
        <Details.Text>
          <Pre>{JSON.stringify(fhirResponse, null, 2)}</Pre>
        </Details.Text>
      </Details>
      <Details expander>
        <Details.Summary>Response (HL7 V3)</Details.Summary>
        <Details.Text>
          <Pre>{hl7V3Response}</Pre>
        </Details.Text>
      </Details>
    </Details.ExpanderGroup>
  )
}

export default MessageExpanders
