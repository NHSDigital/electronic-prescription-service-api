import * as React from "react"
import {JSXElementConstructor, useEffect, useState} from "react"
import {Button, ErrorMessage, Label} from "nhsuk-react-components"
import ButtonList from "./buttonList"
import BackButton from "./backButton"
import {UnhandledAxiosResponseError} from "../requests/unhandledAxiosResponseError"
import RawApiResponse, {createRawApiResponseProps} from "./rawApiResponse"

interface LongRunningTaskProps<T> {
  task: () => Promise<T>
  loadingMessage: string
  children: JSXElementConstructor<T>
  back?: () => void
}

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
        <ErrorMessage>{message}</ErrorMessage>
        {response && <RawApiResponse {...createRawApiResponseProps(response)}/>}
        <ButtonList>
          {back
            ? <Button secondary onClick={back}>Back</Button>
            : <BackButton/>
          }
        </ButtonList>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Label isPageHeading>Loading...</Label>
        <Label>{loadingMessage}</Label>
      </>
    )
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
