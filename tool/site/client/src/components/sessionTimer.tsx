import {Label} from "nhsuk-react-components"
import React, {useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import styled from "styled-components"
import {AppContext} from ".."
import {redirect} from "../browser/navigation"
import {axiosInstance} from "../requests/axiosInstance"

const Timer = styled(Label)`
  float: right;
  color: white;
`

export const SessionTimer: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [cookies] = useCookies()

  const [lastTokenFetched, setlastTokenFetched] = useState(cookies["Last-Token-Fetched"])

  const calculateTimeLeft = () => {
    const now = getUtcEpochSeconds()
    const justLessThenTenMinutes = /*597*/ 15
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

  const handleSessionTimeout = async() => {
    const refreshSession = (await axiosInstance.post<Refresh>(`${baseUrl}auth/refresh`)).data
    if (refreshSession.success) {
      setlastTokenFetched(refreshSession.lastTokenFetched)
    } else if (redirectRequired) {
      setRedirectRequired(false)
      redirect(`${baseUrl}logout`)
    }
  }

  const nonRedirectRoutes = [`${baseUrl}login`, `${baseUrl}logout`, `${baseUrl}prescribe/send`]
  const [redirectRequired, setRedirectRequired] = useState(
    !nonRedirectRoutes.includes(window.location.pathname)
  )

  useEffect(() => {
    setTimeout(async() => {
      const timeLeft = calculateTimeLeft()
      setTimeLeft(timeLeft)
      if (!timeLeft) {
        await handleSessionTimeout()
      }
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
    return null
  }

  return (
    <Timer>{timerIntervals}</Timer>
  )
}

interface Refresh {
  success: boolean
  lastTokenFetched: number
}

function getUtcEpochSeconds() {
  return Date.now() / 1000
}

export default SessionTimer
