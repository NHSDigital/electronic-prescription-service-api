import * as React from "react"
import {JSXElementConstructor, useEffect, useState} from "react"
import {Button, ErrorSummary, Label} from "nhsuk-react-components"
import ButtonList from "./buttonList"
import BackButton from "./backButton"
import {UnhandledAxiosResponseError} from "../../requests/unhandledAxiosResponseError"
import RawApiResponse, {createRawApiResponseProps} from "./rawApiResponse"
import {Loading} from "./loading"

interface LongRunningTaskProps<T> {
  task: () => Promise<T>
  loadingMessage: string
  children: JSXElementConstructor<T>
  back?: () => void
}

// eslint-disable-next-line  @typescript-eslint/no-unnecessary-type-constraint
const LongRunningTask = <T extends unknown>({
  task,
  loadingMessage,
  children,
  back
}: LongRunningTaskProps<T>): React.ReactElement => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<unknown>()
  const [result, setResult] = useState<T>()

  useEffect(() => {
    if (!result) {
      (async () => {
        setLoading(true)
        try {
          const loadResult = await task()
          setResult(loadResult)
        } catch (e) {
          console.log(e)
          setError(e || "Unknown error.")
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [result, task])

  if (error) {
    const message = getMessage(error) || "Unknown error."
    const response = error instanceof UnhandledAxiosResponseError && error.response
    return (
      <>
        <Label isPageHeading>Error</Label>
        <ErrorSummary>
          <ErrorSummary.Title>Something went wrong while processing your request:</ErrorSummary.Title>
          <ErrorSummary.Body>{message}</ErrorSummary.Body>
        </ErrorSummary>
        {response && <RawApiResponse {...createRawApiResponseProps(response)}/>}
        <ButtonList>
          {back ? <Button secondary onClick={back}>Back</Button> : <BackButton/>}
        </ButtonList>
      </>
    )
  }

  if (loading) {
    return <Loading message={loadingMessage} />
  }

  return React.createElement(children, result)
}

function getMessage(error) {
  if (typeof error === "string") {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return error?.toString()
}

export default LongRunningTask
