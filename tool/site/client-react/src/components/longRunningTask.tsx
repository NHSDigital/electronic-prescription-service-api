import * as React from "react"
import {JSXElementConstructor, useEffect, useState} from "react"
import {Button, ErrorMessage, Label} from "nhsuk-react-components"
import ButtonList from "./buttonList"

interface LongRunningTaskProps<T> {
  task: () => Promise<T>
  message: string
  children: JSXElementConstructor<T>
  back?: () => void
}

const LongRunningTask = <T extends unknown>({
  task,
  message,
  children,
  back
}: LongRunningTaskProps<T>): React.ReactElement => {
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [result, setResult] = useState<T>()

  useEffect(() => {
    async function performTask() {
      setLoading(true)
      try {
        const loadResult = await task()
        setResult(loadResult)
      } catch (e) {
        console.log(e)
        setErrorMessage(e.message)
      } finally {
        setLoading(false)
      }
    }

    if (!result) {
      performTask()
    }
  }, [result, task])

  if (errorMessage) {
    return (
      <>
        <Label isPageHeading>Error</Label>
        <ErrorMessage>{errorMessage}</ErrorMessage>
        {back && (
          <ButtonList>
            <Button secondary onClick={back}>Back</Button>
          </ButtonList>
        )}
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Label isPageHeading>Loading...</Label>
        <Label>{message}</Label>
      </>
    )
  }

  return React.createElement(children, result)
}

export default LongRunningTask
