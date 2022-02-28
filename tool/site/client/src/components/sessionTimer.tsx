import {Label} from "nhsuk-react-components"
import React, {useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import styled from "styled-components"
import {AppContext} from ".."
import {isRedirect, redirect} from "../browser/navigation"
import {axiosInstance} from "../requests/axiosInstance"

const Timer = styled(Label)`
  float: right;
  color: white;
`

export const SessionTimer: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [cookies] = useCookies()

  const accessTokenFetched = cookies["Access-Token-Fetched"]
  const lastTokenRefresh = cookies["Last-Token-Refresh"]

  const calculateTimeToTokenExpiry = () => {
    const now = getUtcEpochSeconds()
    return cookies["Refresh-Token-Expires-In"] - (now - accessTokenFetched)
  }

  const [tokenExpiresIn, setTokenExpiresIn] = useState(calculateTimeToTokenExpiry())
  const [nextRefreshTime, setNextRefreshTime] = useState(cookies["Next-Refresh-Time"])
  const [refreshAttempts, setRefreshAttempts] = useState(0)

  const refreshToken = async() => {
    const result = (await axiosInstance.post(`${baseUrl}auth/refresh`, undefined, {withCredentials: true})).data
    if (isRedirect(result)) {
      redirect(result.redirectUri)
      return {nextRefreshTime: 0}
    } else {
      return result
    }
  }

  const nonRedirectRoutes = [`${baseUrl}login`, `${baseUrl}logout`, `${baseUrl}prescribe/send`]
  const [redirectRequired, setRedirectRequired] = useState(
    !nonRedirectRoutes.includes(window.location.pathname)
  )

  useEffect(() => {
    setTimeout(() => {
      if (tokenExpiresIn <= 0) {
        if (redirectRequired) {
          setRedirectRequired(false)
          redirect(`${baseUrl}logout`)
        }
      }
      setTokenExpiresIn(calculateTimeToTokenExpiry())
    }, 1000)
  })

  useEffect(() => {
    const refreshRequired =
      lastTokenRefresh > nextRefreshTime
      && refreshAttempts <= 10
    if (refreshRequired) {
      refreshToken().then(result => {
        setNextRefreshTime(result.nextRefreshTime)
        setRefreshAttempts(refreshAttempts+1)
      })
    }
  })

  const createTimeIntervals = (timeLeft: number) => {
    return timeLeft > 0
      ? {
        minutes: Math.floor((timeLeft / 60) % 60),
        seconds: Math.floor((timeLeft) % 60)
      }
      : {}
  }

  const timeIntervals = createTimeIntervals(tokenExpiresIn)
  const timerIntervalElements = []
  Object.keys(timeIntervals).forEach((interval, index) => {
    if (!timeIntervals[interval]) {
      return
    }
    timerIntervalElements.push(
      <span key={index}>
        {timeIntervals[interval]} {interval}{" "}
      </span>
    )
  })

  if (!timerIntervalElements.length) {
    return null
  }

  return (
    <Timer>{timerIntervalElements}</Timer>
  )
}

function getUtcEpochSeconds() {
  return Date.now() / 1000
}

export default SessionTimer
