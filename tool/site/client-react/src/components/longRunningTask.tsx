import * as React from "react"
import {JSXElementConstructor, useContext, useEffect, useState} from "react"
import {Button, ErrorMessage, Label} from "nhsuk-react-components"
import ButtonList from "./buttonList"
import {AppContext} from "../index"

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
  const [errorMessage, setErrorMessage] = useState<string>()
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
          setErrorMessage((typeof e === "string" ? e : e?.message) || "Unknown error")
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [result, task])

  if (errorMessage) {
    return (
      <>
        <Label isPageHeading>Error</Label>
        <ErrorMessage>{errorMessage}</ErrorMessage>
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

export default LongRunningTask
