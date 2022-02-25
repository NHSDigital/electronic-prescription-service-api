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

  const accessTokenExpiresIn = cookies["Token-Expires-In"]
  const accessTokenFetched = cookies["Access-Token-Fetched"]
  const lastTokenRefresh = cookies["Last-Token-Refresh"] ?? cookies["Access-Token-Fetched"]

  const calculateTimeToTokenExpiry = () => {
    const now = getUtcEpochSeconds()
    return /*cookies["Refresh-Token-Expires-In"]*/ 60 - (now - accessTokenFetched)
  }

  const calculateTimeSinceRefresh = (lastTokenRefresh: number) => {
    const now = getUtcEpochSeconds()
    return now - lastTokenRefresh
  }

  const [tokenExpiresIn, setTokenExpiresIn] = useState(calculateTimeToTokenExpiry())
  const [timeSinceRefresh, setTimeSinceRefresh] = useState(calculateTimeSinceRefresh(lastTokenRefresh))
  const [refreshTokenInProgress, setRefreshTokenInProgress] = useState(false)

  const refreshToken = async() => {
    const result = (await axiosInstance.post(`${baseUrl}auth/refresh`)).data
    if (isRedirect(result)) {
      redirect(result.redirectUri)
      return 999
    } else {
      return result
    }
  }

  const nonRedirectRoutes = [`${baseUrl}login`, `${baseUrl}logout`, `${baseUrl}prescribe/send`]
  const [redirectRequired, setRedirectRequired] = useState(
    !nonRedirectRoutes.includes(window.location.pathname)
  )

  useEffect(() => {
    setTimeout(async() => {
      if (!refreshTokenInProgress) {
        if (calculateTimeSinceRefresh(timeSinceRefresh) >= (/*accessTokenExpiresIn*/ 30 - 10)) {
          setRefreshTokenInProgress(true)
          const result = await refreshToken()
          setTimeSinceRefresh(calculateTimeSinceRefresh(parseFloat(result.lastTokenRefresh)))
          setRefreshTokenInProgress(false)
        }
      }
      if (tokenExpiresIn <= 0) {
        if (redirectRequired) {
          setRedirectRequired(false)
          redirect(`${baseUrl}logout`)
        }
      }
      setTokenExpiresIn(calculateTimeToTokenExpiry())
    }, 1000)
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
    if (!timeIntervals[index])
    {
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
