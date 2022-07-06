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
      name="FHIR Request that a supplier would send to the FHIR API"
      message={fhirRequest}
    />
    {hl7V3Request && <XmlMessageExpander
      name="Equivalent hl7v3 that the FHIR API has sent to spine"
      message={hl7V3Request}
    />}
    <JsonMessageExpander
      name="FHIR Response that a supplier will receive from the FHIR API"
      message={fhirResponse}
    />
    {hl7V3Response && <XmlMessageExpander
      name="The hl7v3 spine response that the FHIR API received from spine"
      message={hl7V3Response}
    />}
  </Details.ExpanderGroup>
)

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
          displayDataTypes={false}
          displayObjectSize={false}
          name={false}
          src={message}
          style={{marginTop: "10px"}}
          theme={theme}
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

const theme = {
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

export default MessageExpanders
