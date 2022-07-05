import * as React from "react"
import {Button, Details} from "nhsuk-react-components"
import Pre from "./common/pre"
import {FhirResource} from "fhir/r4"
import ButtonList from "./common/buttonList"
import styled from "styled-components"
import ReactJson from "react-json-view"

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
    <JsonMessageExpander
      name="Request (FHIR)"
      message={fhirRequest}
      mimeType="application/json"
    />
    {hl7V3Request && <XmlMessageExpander
      name="Request (HL7 V3)"
      message={hl7V3Request}
      mimeType="text/xml"
    />}
    <JsonMessageExpander
      name="Response (FHIR)"
      message={fhirResponse}
      mimeType="application/json"
    />
    {hl7V3Response && <XmlMessageExpander
      name="Response (HL7 V3)"
      message={hl7V3Response}
      mimeType="text/xml"
    />}
  </Details.ExpanderGroup>
)

const StyledButton = styled(Button)`
  margin-bottom: 0;
`

interface JsonMessageExpanderProps {
  name: string
  // eslint-disable-next-line @typescript-eslint/ban-types
  message: object
  mimeType: string
}

interface XmlMessageExpanderProps {
  name: string
  message: string
  mimeType: string
}

export const JsonMessageExpander: React.FC<JsonMessageExpanderProps> = ({
  name,
  message,
  mimeType
}) => {
  const downloadHref = `data:${mimeType};charset=utf-8,${encodeURIComponent(JSON.stringify(message))}`
  return (
    <Details expander>
      <Details.Summary>{name}</Details.Summary>
      <Details.Text>
        <ButtonList>
          <StyledButton onClick={() => navigator.clipboard.writeText(JSON.stringify(message))}>Copy</StyledButton>
          <StyledButton download="message" href={downloadHref}>Download</StyledButton>
        </ButtonList>
        <ReactJson
          collapseStringsAfterLength={50}
          displayDataTypes={false}
          displayObjectSize={false}
          name={false}
          src={message}
          style={{marginTop: "10px"}}
          theme={
            {
              base00: "#FFFFFF",
              base01: "#000000",
              base02: "#000000",
              base03: "#000000",
              base04: "#000000",
              base05: "#000000",
              base06: "#000000",
              base07: "#005eb8",
              base08: "#000000",
              base09: "#000000",
              base0A: "#000000",
              base0B: "#000000",
              base0C: "#000000",
              base0D: "#000000",
              base0E: "#000000",
              base0F: "#000000"
            }
          }
        />
      </Details.Text>
    </Details>
  )
}

export const XmlMessageExpander: React.FC<XmlMessageExpanderProps> = ({
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
