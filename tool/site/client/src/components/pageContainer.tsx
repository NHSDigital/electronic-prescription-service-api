import * as React from "react"
import {ReactNode} from "react"
import {Col, Container, Header, Images, Row} from "nhsuk-react-components"
import {AppContext} from "../index"
import {PageFooter} from "./pageFooter"
import {useCookies} from "react-cookie"
import SessionTimer from "./sessionTimer"
import {isDev} from "../services/environment"
import styled from "styled-components"

interface PageContainerProps {
  children?: ReactNode
}

const StyledImages = styled(Images)`
  background: #005eb8;
  width: 30px;
  margin-left: 25px;
`

export const PageContainer: React.FC = (props: PageContainerProps) => {
  const [cookies] = useCookies()

  const loggedIn = cookies["Access-Token-Set"]

  return (
    <AppContext.Consumer>
      {({baseUrl, environment}) => (
        <>
          <Header transactional>
            <Header.Container>
              <Header.Logo href={baseUrl}/>
              {loggedIn && isDev(environment)
                ? <Header.ServiceName href={`${baseUrl}config`}>
                  <div className="inline-flex">
                      EPSAT - Electronic Prescription Service API Tool
                    <StyledImages srcSet={`${baseUrl}static/Cogs_SVG_White.svg`} sizes="50px"/>
                  </div>
                </Header.ServiceName>
                : <Header.ServiceName href={baseUrl}>EPSAT - Electronic Prescription Service API Tool</Header.ServiceName>
              }
              <SessionTimer/>
            </Header.Container>
            {loggedIn &&
              <Header.Nav>
                <Header.NavItem href={baseUrl}>Home</Header.NavItem>
                <Header.NavItem href={`${baseUrl}my-prescriptions`}>My Prescriptions</Header.NavItem>
                <Header.NavItem href={`${baseUrl}logout`}>Logout</Header.NavItem>
              </Header.Nav>
            }
          </Header>
          <main className="nhsuk-main-wrapper" id="maincontent" role="main">
            <Container id="pageContainer">
              <Row>
                <Col width="full">{props.children}</Col>
              </Row>
            </Container>
          </main>
          <PageFooter/>
        </>
      )}
    </AppContext.Consumer>
  )
}
