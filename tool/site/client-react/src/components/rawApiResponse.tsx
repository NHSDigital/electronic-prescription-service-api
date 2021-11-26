import {AxiosResponse} from "axios"
import {SummaryList} from "nhsuk-react-components"
import React from "react"
import {MessageExpander} from "./messageExpanders"

export function createRawApiResponseProps(axiosResponse: AxiosResponse): RawApiResponseProps {
  const props: RawApiResponseProps = {
    status: `${axiosResponse.status} ${axiosResponse.statusText}`,
    responseHeaders: axiosResponse.headers,
    responseBody: axiosResponse.data
  }
  const request = axiosResponse.request
  console.log(request)
  if (request) {
    props.url = request.url
    props.requestHeaders = request.headers
    props.requestBody = request.data
  }
  return props
}

interface RawApiResponseProps {
  url?: string
  requestHeaders?: Record<string, unknown>
  requestBody?: unknown
  status: string
  responseHeaders: Record<string, unknown>
  responseBody: unknown
}

const RawApiResponse: React.FC<RawApiResponseProps> = ({
  url,
  requestHeaders,
  requestBody,
  status,
  responseHeaders,
  responseBody
}) => {
  return (
    <>
      <SummaryList>
        {
          url && (
            <SummaryList.Row>
              <SummaryList.Key>URL</SummaryList.Key>
              <SummaryList.Value>{url}</SummaryList.Value>
            </SummaryList.Row>
          )
        }
        <SummaryList.Row>
          <SummaryList.Key>Status</SummaryList.Key>
          <SummaryList.Value>{status}</SummaryList.Value>
        </SummaryList.Row>
      </SummaryList>
      {requestHeaders && (
        <MessageExpander name="Request Headers" message={formatHeaders(requestHeaders)} mimeType="text/plain"/>
      )}
      {requestBody && (
        <MessageExpander name="Request Body" message={formatBody(requestBody)} mimeType="text/plain"/>
      )}
      <MessageExpander name="Response Headers" message={formatHeaders(responseHeaders)} mimeType="text/plain"/>
      <MessageExpander name="Response Body" message={formatBody(responseBody)} mimeType="text/plain"/>
    </>
  )
}

function formatHeaders(headers: Record<string, unknown>): string {
  return JSON.stringify(headers, null, 2)
}

function formatBody(body: unknown): string {
  return typeof body === "string"
    ? body
    : JSON.stringify(body, null, 2)
}

export default RawApiResponse
