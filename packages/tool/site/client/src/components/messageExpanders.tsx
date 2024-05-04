import * as React from "react"
import {Button, Details} from "nhsuk-react-components"
import Pre from "./common/pre"
import {FhirResource} from "fhir/r4"
import ButtonList from "./common/buttonList"
import styled from "styled-components"
import ReactJson from "react18-json-view"

interface MessageExpandersProps {
  fhirRequest: FhirResource
  hl7V3Request?: string
  hl7V3Response?: string
  fhirResponse: FhirResource
}

const MessageExpanders: React.FC<MessageExpandersProps> = ({
  fhirRequest,
  hl7V3Request,
  hl7V3Response,
  fhirResponse
}) => {
  let index = 1
  return <Details.ExpanderGroup>
    <JsonMessageExpander
      name={`${index++} - FHIR Request that a supplier would send to the FHIR API`}
      message={fhirRequest}
    />
    {hl7V3Request && <XmlMessageExpander
      name={`${index++} - Equivalent hl7v3 that the FHIR API has sent to spine`}
      message={hl7V3Request}
    />}
    {hl7V3Response && <XmlMessageExpander
      name={`${index++} -  The hl7v3 spine response that the FHIR API received from spine`}
      message={hl7V3Response}
    />}
    <JsonMessageExpander
      name={`${index} - FHIR Response that a supplier will receive from the FHIR API`}
      message={fhirResponse}
    />
  </Details.ExpanderGroup>
}

const StyledButton = styled(Button)`
  margin-bottom: 0;
`

interface JsonMessageExpanderProps {
  name: string
  message: FhirResource
}

interface XmlMessageExpanderProps {
  name: string
  message: string
}

export const JsonMessageExpander: React.FC<JsonMessageExpanderProps> = ({
  name,
  message
}) => {
  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(message, null, 2))}`
  return (
    <Details expander>
      <Details.Summary>{name}</Details.Summary>
      <Details.Text>
        <ButtonList>
          <StyledButton onClick={() => navigator.clipboard.writeText(JSON.stringify(message, null, 2))}>Copy</StyledButton>
          <StyledButton download="message" href={downloadHref}>Download</StyledButton>
        </ButtonList>
        <ReactJson
          collapseStringsAfterLength={50}
          displaySize={false}
          src={message}
          style={{marginTop: "10px"}}
        />
      </Details.Text>
    </Details>
  )
}

export const XmlMessageExpander: React.FC<XmlMessageExpanderProps> = ({
  name,
  message
}) => {
  const downloadHref = `data:text/xml;charset=utf-8,${encodeURIComponent(message)}`
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
