import {Label} from "nhsuk-react-components"
import React, {useContext, useEffect, useState} from "react"
import styled from "styled-components"
import {AppContext} from ".."
import {redirect} from "../browser/navigation"

interface RefreshTokenProps {
  lastTokenFetch: number
}

const Timer = styled(Label)`
  float: right;
  color: white;
`

const SessionExpired = styled(Label)`
  float: right;
  color: red;
`

export const RefreshToken: React.FC<RefreshTokenProps> = ({
  lastTokenFetch
}) => {
  const {baseUrl} = useContext(AppContext)

  const calculateTimeLeft = () => {
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

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
  })

  const timerIntervals = []

  Object.keys(timeLeft).forEach((interval, index) => {
    if (!timeLeft[interval]) {
      return
    }

    timerIntervals.push(
      <span key={index}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    )
  })

  if (!timerIntervals.length) {
    redirect(`${baseUrl}logout`)
    return <SessionExpired>Session expired!</SessionExpired>
  }

  return (
    <Timer>{timerIntervals}</Timer>
  )
}

function tenMinutesAfter(lastTokenFetch: number) {
  return lastTokenFetch + new Date().getMinutes() + 10000 * 60
}

export default RefreshToken
