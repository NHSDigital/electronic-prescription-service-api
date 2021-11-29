import {AxiosResponse} from "axios"
import {Fieldset, SummaryList} from "nhsuk-react-components"
import React from "react"
import {MessageExpander} from "./messageExpanders"

export function createRawApiResponseProps(axiosResponse: AxiosResponse): RawApiResponseProps {
  return {
    method: axiosResponse.config.method.toUpperCase(),
    url: axiosResponse.config.url,
    requestParams: axiosResponse.config.params,
    requestHeaders: axiosResponse.config.headers,
    requestBody: axiosResponse.config.data,
    status: `${axiosResponse.status} ${axiosResponse.statusText}`,
    responseHeaders: axiosResponse.headers,
    responseBody: axiosResponse.data
  }
}

interface RawApiResponseProps {
  method: string
  url: string
  requestParams?: Record<string, unknown>
  requestHeaders?: Record<string, unknown>
  requestBody?: unknown
  status: string
  responseHeaders?: Record<string, unknown>
  responseBody?: unknown
}

const RawApiResponse: React.FC<RawApiResponseProps> = ({
  method,
  url,
  requestParams,
  requestHeaders,
  requestBody,
  status,
  responseHeaders,
  responseBody
}) => {
  return (
    <>
      <Fieldset>
        <Fieldset.Legend size="m">Request Details</Fieldset.Legend>
        <SummaryList>
          <SummaryList.Row>
            <SummaryList.Key>Method</SummaryList.Key>
            <SummaryList.Value>{method}</SummaryList.Value>
          </SummaryList.Row>
          <SummaryList.Row>
            <SummaryList.Key>URL</SummaryList.Key>
            <SummaryList.Value>{url}</SummaryList.Value>
          </SummaryList.Row>
        </SummaryList>
        {requestParams && (
          <MessageExpander name="Request Query Params" message={formatAsString(requestParams)} mimeType="text/plain"/>
        )}
        {requestHeaders && (
          <MessageExpander name="Request Headers" message={formatAsString(requestHeaders)} mimeType="text/plain"/>
        )}
        {requestBody && (
          <MessageExpander name="Request Body" message={formatAsString(requestBody)} mimeType="text/plain"/>
        )}
      </Fieldset>
      <Fieldset>
        <Fieldset.Legend size="m">Response Details</Fieldset.Legend>
        <SummaryList>
          <SummaryList.Row>
            <SummaryList.Key>Status</SummaryList.Key>
            <SummaryList.Value>{status}</SummaryList.Value>
          </SummaryList.Row>
        </SummaryList>
        {responseHeaders && (
          <MessageExpander name="Response Headers" message={formatAsString(responseHeaders)} mimeType="text/plain"/>
        )}
        {responseBody && (
          <MessageExpander name="Response Body" message={formatAsString(responseBody)} mimeType="text/plain"/>
        )}
      </Fieldset>
    </>
  )
}

function formatAsString(thing: unknown): string {
  return typeof thing === "string" ? thing : JSON.stringify(thing, null, 2)
}

export default RawApiResponse
