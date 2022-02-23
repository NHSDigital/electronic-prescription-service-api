import {Label} from "nhsuk-react-components"
import React, {useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import styled from "styled-components"
import {AppContext} from ".."
import {redirect} from "../browser/navigation"

const Timer = styled(Label)`
  float: right;
  color: white;
`

export const SessionTimer: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [cookies] = useCookies()

  const lastTokenFetched = cookies["Last-Token-Fetched"]

  const calculateTimeLeft = () => {
    const now = Math.round(new Date().getUTCMilliseconds() / 1000)
    const justLessThenTenMinutes = 597
    const difference = justLessThenTenMinutes - (now - lastTokenFetched)
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor((difference / 60) % 60),
        seconds: Math.floor((difference) % 60)
      }
    }

    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  const nonRedirectRoutes = [`${baseUrl}login`, `${baseUrl}logout`, `${baseUrl}prescribe/send`]
  const [redirectRequired, setRedirectRequired] = useState(
    !nonRedirectRoutes.includes(window.location.pathname)
  )

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
    if (redirectRequired) {
      setRedirectRequired(false)
      redirect(`${baseUrl}logout`)
    }
    return null
  }

  return (
    <Timer>{timerIntervals}</Timer>
  )
}

export default SessionTimer
