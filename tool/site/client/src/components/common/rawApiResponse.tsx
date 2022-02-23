import {AxiosResponse} from "axios"
import {Fieldset, SummaryList} from "nhsuk-react-components"
import React from "react"
import {MessageExpander} from "../messageExpanders"

export function createRawApiResponseProps(axiosResponse: AxiosResponse): RawApiResponseProps {
  const request = axiosResponse.config
  return {
    request: {
      method: request.method.toUpperCase(),
      url: request.url,
      params: request.params,
      headers: request.headers,
      body: request.data
    },
    response: {
      status: `${axiosResponse.status} ${axiosResponse.statusText}`,
      headers: axiosResponse.headers,
      body: axiosResponse.data
    }
  }
}

interface RawApiResponseProps {
  request: {
    method: string
    url: string
    params?: Record<string, unknown>
    headers?: Record<string, unknown>
    body?: unknown
  }
  response: {
    status: string
    headers?: Record<string, unknown>
    body?: unknown
  }
}

const RawApiResponse: React.FC<RawApiResponseProps> = ({
  request,
  response
}) => {
  return (
    <>
      <Fieldset>
        <Fieldset.Legend size="m">Request Details</Fieldset.Legend>
        <SummaryList>
          <SummaryList.Row>
            <SummaryList.Key>Method</SummaryList.Key>
            <SummaryList.Value>{request.method}</SummaryList.Value>
          </SummaryList.Row>
          <SummaryList.Row>
            <SummaryList.Key>URL</SummaryList.Key>
            <SummaryList.Value>{request.url}</SummaryList.Value>
          </SummaryList.Row>
        </SummaryList>
        {request.params && (
          <MessageExpander name="Request Query Params" message={formatAsString(request.params)} mimeType="text/plain"/>
        )}
        {request.headers && (
          <MessageExpander name="Request Headers" message={formatAsString(request.headers)} mimeType="text/plain"/>
        )}
        {request.body && (
          <MessageExpander name="Request Body" message={formatAsString(request.body)} mimeType="text/plain"/>
        )}
      </Fieldset>
      <Fieldset>
        <Fieldset.Legend size="m">Response Details</Fieldset.Legend>
        <SummaryList>
          <SummaryList.Row>
            <SummaryList.Key>Status</SummaryList.Key>
            <SummaryList.Value>{response.status}</SummaryList.Value>
          </SummaryList.Row>
        </SummaryList>
        {response.headers && (
          <MessageExpander name="Response Headers" message={formatAsString(response.headers)} mimeType="text/plain"/>
        )}
        {response.body && (
          <MessageExpander name="Response Body" message={formatAsString(response.body)} mimeType="text/plain"/>
        )}
      </Fieldset>
    </>
  )
}

function formatAsString(thing: unknown): string {
  if (typeof thing === "string") {
    return thing
  }
  if (thing instanceof URLSearchParams) {
    const values: Array<[string, string]> = []
    thing.forEach((value, key) => values.push([key, value]))
    return values.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`).join("\n")
  }
  return JSON.stringify(thing, null, 2)
}

export default RawApiResponse
