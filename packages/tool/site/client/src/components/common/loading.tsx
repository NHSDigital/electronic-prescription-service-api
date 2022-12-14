import * as React from "react"
import {Label} from "nhsuk-react-components"
import styled from "styled-components"

const StyledLabel = styled(Label)`
  position: relative;
  textAlign: center;
`

interface LoadingProps {
  message: string
}

export const Loading: React.FC<LoadingProps> = ({
  message
}) => {
  return (
    <div style={{textAlign: "center"}}>
      <StyledLabel isPageHeading>Loading</StyledLabel>
      <div className="nhsuk-loader">
        <span className="nhsuk-loader__spinner"></span>
        <span className="nhsuk-loader__text">{message}</span>
      </div>
    </div>
  )
}

export const Spinner: React.FC = () => {
  return (
    <div style={{margin: 0, float: "left"}} className="nhsuk-loader">
      <span style={{width:"34px", height: "34px"}} className="nhsuk-loader__spinner nhsuk-loader--small"></span>
    </div>
  )
}
