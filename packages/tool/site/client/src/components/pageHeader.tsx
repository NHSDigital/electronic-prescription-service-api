import * as React from "react"
import {useContext} from "react"
import {Header, Images} from "nhsuk-react-components"
import {AppContext} from "../index"
import {isSandbox} from "../services/environment"
import SessionTimer from "./sessionTimer"
import styled from "styled-components"

interface PageHeaderProps {
  loggedIn: boolean
}

const StyledImages = styled(Images)`
  background: #005eb8;
  width: 30px;
  margin-left: 25px;
`

export const PageHeader: React.FC<PageHeaderProps> = ({loggedIn}) => {
  const {baseUrl, environment} = useContext(AppContext)
  return (
    <Header transactional>
      <Header.Container>
        <Header.Logo href={baseUrl} />
        {loggedIn ? (
          <Header.ServiceName href={`${baseUrl}config`}>
            <div className="inline-flex">
              EPSAT - Electronic Prescription Service API Tool
              <StyledImages srcSet={`${baseUrl}static/Cogs_SVG_White.svg`} sizes="50px" />
            </div>
          </Header.ServiceName>
        ) : (
          <Header.ServiceName href={baseUrl}>EPSAT - Electronic Prescription Service API Tool</Header.ServiceName>
        )}
        <SessionTimer />
      </Header.Container>
      {loggedIn && (
        <Header.Nav>
          <Header.NavItem href={baseUrl}>Home</Header.NavItem>
          <Header.NavItem href={`${baseUrl}my-prescriptions`}>My Prescriptions</Header.NavItem>
          {!isSandbox(environment) && <Header.NavItem href={`${baseUrl}logout`}>Logout</Header.NavItem>}
        </Header.Nav>
      )}
    </Header>
  )
}
