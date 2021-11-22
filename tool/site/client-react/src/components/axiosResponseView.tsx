import {AxiosResponse} from "axios"
import {SummaryList} from "nhsuk-react-components"
import React from "react"
import {MessageExpander} from "./messageExpanders"

interface AxiosResponseViewProps {
  response: AxiosResponse
}

const AxiosResponseView: React.FC<AxiosResponseViewProps> = ({response}) => {
  const responseData = response.data
  const formattedResponseHeaders = JSON.stringify(response.headers, null, 2)
  const formattedResponseBody = typeof responseData === "string"
    ? responseData
    : JSON.stringify(responseData, null, 2)
  return (
    <>
      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>Status</SummaryList.Key>
          <SummaryList.Value>{response.status} {response.statusText}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      <MessageExpander name="Response Headers" message={formattedResponseHeaders} mimeType="text/plain"/>
      <MessageExpander name="Response Body" message={formattedResponseBody} mimeType="text/plain"/>
    </>
  )
}

export default AxiosResponseView
