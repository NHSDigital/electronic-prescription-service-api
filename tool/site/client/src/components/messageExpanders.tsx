import * as React from "react"
import {Button, Details} from "nhsuk-react-components"
import Pre from "./common/pre"
import {FhirResource} from "fhir/r4"
import ButtonList from "./common/buttonList"
import styled from "styled-components"

interface MessageExpandersProps {
  fhirRequest: FhirResource
  hl7V3Request?: string
  fhirResponse: FhirResource
  hl7V3Response?: string
}

const MessageExpanders: React.FC<MessageExpandersProps> = ({
  fhirRequest,
  hl7V3Request,
  fhirResponse,
  hl7V3Response
}) => (
  <Details.ExpanderGroup>
    <MessageExpander
      name="FHIR Request that a supplier would send to the FHIR API"
      message={JSON.stringify(fhirRequest, null, 2)}
      mimeType="application/json"
    />
    {hl7V3Request && <MessageExpander
      name="Equivalent hl7v3 that the FHIR API has sent to spine"
      message={hl7V3Request}
      mimeType="text/xml"
    />}
    <MessageExpander
      name="FHIR Response that a supplier will receive from the FHIR API"
      message={JSON.stringify(fhirResponse, null, 2)}
      mimeType="application/json"
    />
    {hl7V3Response && <MessageExpander
      name="The hl7v3 spine response that the FHIR API received from spine"
      message={hl7V3Response}
      mimeType="text/xml"
    />}
  </Details.ExpanderGroup>
)

interface MessageExpanderProps {
  name: string
  message: string
  mimeType: string
}

const StyledButton = styled(Button)`
  margin-bottom: 0;
`

export const MessageExpander: React.FC<MessageExpanderProps> = ({
  name,
  message,
  mimeType
}) => {
  const downloadHref = `data:${mimeType};charset=utf-8,${encodeURIComponent(message)}`
  return (
    <Details expander>
      <Details.Summary>{name}</Details.Summary>
      <Details.Text>
        <ButtonList>
          <StyledButton onClick={() => navigator.clipboard.writeText(message)}>Copy</StyledButton>
          <StyledButton download="message" href={downloadHref}>Download</StyledButton>
        </ButtonList>
        <Pre>{message}</Pre>
      </Details.Text>
    </Details>
  )
}

export default MessageExpanders
