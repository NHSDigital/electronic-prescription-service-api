import {Label} from "nhsuk-react-components"
import React, {useContext, useEffect, useState} from "react"
import styled from "styled-components"
import {AppContext} from ".."
import {redirect} from "../browser/navigation"

interface RefreshTokenProps {
  lastTokenFetch: number
}

const StyledLabel = styled(Label)`
  float: right;
  color: white;
`

export const RefreshToken : React.FC<RefreshTokenProps> = ({
  lastTokenFetch
}) => {
  const {baseUrl} = useContext(AppContext)

  const calculateNextTokenFetchTime = () => {
    const difference = + tenMinutesAfter(lastTokenFetch) - + Date.now()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateNextTokenFetchTime())

  useEffect(() => {
    setTimeout(() => {
      setTimeLeft(calculateNextTokenFetchTime())
    }, 1000)
  })

  const timerComponents = []

  Object.keys(timeLeft).forEach((interval, index) => {
    if (!timeLeft[interval]) {
      return
    }

    timerComponents.push(
      <span key={index}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    )
  })

  if (!timerComponents.length) {
    redirect(`${baseUrl}logout`)
    return <StyledLabel>Session expired</StyledLabel>
  }

  return (
    <StyledLabel>{timerComponents}</StyledLabel>
  )
}

function tenMinutesAfter(lastTokenFetch: number) {
  return lastTokenFetch + new Date().getMinutes() + 10000 * 60
}

export default RefreshToken
