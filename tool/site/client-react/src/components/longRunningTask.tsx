import * as React from "react"
import {JSXElementConstructor, useContext, useEffect, useState} from "react"
import {Button, ErrorMessage, Label} from "nhsuk-react-components"
import ButtonList from "./buttonList"
import {AppContext} from "../index"
import {UnhandledAxiosResponseError} from "../requests/unhandledAxiosResponseError"
import AxiosResponseView from "./axiosResponseView"
import {MessageExpander} from "./messageExpanders"

interface LongRunningTaskProps<T> {
  task: () => Promise<T>
  loadingMessage: string
  children: JSXElementConstructor<T>
  back?: string | (() => void)
}

const LongRunningTask = <T extends unknown>({
  task,
  loadingMessage,
  children,
  back
}: LongRunningTaskProps<T>): React.ReactElement => {
  const {baseUrl} = useContext(AppContext)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<unknown>()
  const [result, setResult] = useState<T>()

  if (!back) {
    back = baseUrl
  }

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
    const stack = error instanceof Error && error.stack
    return (
      <>
        <Label isPageHeading>Error</Label>
        <ErrorMessage>{message}</ErrorMessage>
        {response && <AxiosResponseView response={response}/>}
        {stack && <MessageExpander name="Stacktrace" message={stack} mimeType="text/plain"/>}
        <ButtonList>
          {typeof back === "string"
            ? <Button secondary href={back}>Back</Button>
            : <Button secondary onClick={back}>Back</Button>
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
