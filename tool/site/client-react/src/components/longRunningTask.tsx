import * as React from "react"
import {JSXElementConstructor, useEffect, useState} from "react"
import {Button, ErrorMessage, Label} from "nhsuk-react-components"
import ButtonList from "./buttonList"
import BackButton from "./backButton"

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
  const [errorMessage, setErrorMessage] = useState<string>()
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
          {back
            ? <Button secondary onClick={back}>Back</Button>
            : <BackButton/>
          }
          <BackButton/>
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
