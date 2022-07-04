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
    <MessageExpander
      name="Request (FHIR)"
      message={JSON.stringify(fhirResponse, null, 2)}
      jsonMessage={fhirRequest}
      mimeType="application/json"
    />
    {hl7V3Request && <MessageExpander
      name="Request (HL7 V3)"
      message={hl7V3Request}
      mimeType="text/xml"
    />}
    <MessageExpander
      name="Response (FHIR)"
      message={JSON.stringify(fhirResponse, null, 2)}
      jsonMessage={fhirResponse}
      mimeType="application/json"
    />
    {hl7V3Response && <MessageExpander
      name="Response (HL7 V3)"
      message={hl7V3Response}
      mimeType="text/xml"
    />}
  </Details.ExpanderGroup>
)

interface MessageExpanderProps {
  name: string
  message: string
  jsonMessage?: FhirResource
  mimeType: string
}

const StyledButton = styled(Button)`
  margin-bottom: 0;
`

export const MessageExpander: React.FC<MessageExpanderProps> = ({
  name,
  message,
  jsonMessage,
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
        {jsonMessage ?
          <ReactJson
            collapseStringsAfterLength={50}
            displayDataTypes={false}
            displayObjectSize={false}
            name={false}
            src={jsonMessage}
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
          /> :
          <Pre>{message}</Pre>
        }
      </Details.Text>
    </Details>
  )
}

export default MessageExpanders
