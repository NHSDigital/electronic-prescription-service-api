import {AxiosResponse} from "axios"
import {Fieldset, SummaryList} from "nhsuk-react-components"
import React from "react"
import {XmlMessageExpander} from "../messageExpanders"

export function createRawApiResponseProps(axiosResponse: AxiosResponse): RawApiResponseProps {
  const request = axiosResponse.request // TODO: Check this is correct
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
          <XmlMessageExpander name="Request Query Params" message={formatAsString(request.params)}/>
        )}
        {request.headers && (
          <XmlMessageExpander name="Request Headers" message={formatAsString(request.headers)}/>
        )}
        {request.body && (
          <XmlMessageExpander name="Request Body" message={formatAsString(request.body)}/>
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
          <XmlMessageExpander name="Response Headers" message={formatAsString(response.headers)}/>
        )}
        {response.body && (
          <XmlMessageExpander name="Response Body" message={formatAsString(response.body)}/>
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
