import * as React from "react"
import {ReactNode} from "react"
import {Col, Container, Footer, Header, Row} from "nhsuk-react-components"
import {AppContext} from "../index"

interface PageContainerProps {
  children?: ReactNode
}

interface SoftwareVersions {
  eps: string
  signingService: string
  validator: string
}

export const PageContainer: React.FC = (props: PageContainerProps) => {
  
  const softwareVersions = getSoftwareVersions()

  return (
    <AppContext.Consumer>
      {({baseUrl}) => (
        <>
          <Header transactional>
            <Header.Container>
              <Header.Logo href={baseUrl}/>
              <Header.ServiceName href={baseUrl}>EPSAT - Electronic Prescription Service API Tool</Header.ServiceName>
            </Header.Container>
            <Header.Nav>
              <Header.NavItem href={baseUrl}>
                Home
              </Header.NavItem>
              <Header.NavItem href={`${baseUrl}my-prescriptions`}>
                My Prescriptions
              </Header.NavItem>
            </Header.Nav>
          </Header>
          <main className="nhsuk-main-wrapper" id="maincontent" role="main">
            <Container>
              <Row>
                <Col width="full">{props.children}</Col>
              </Row>
            </Container>
          </main>
          <Footer>
            <Footer.List>
              <Footer.ListItem>EPS: {softwareVersions.eps}</Footer.ListItem>
              <Footer.ListItem>Signing-Service: {softwareVersions.signingService}</Footer.ListItem>
              <Footer.ListItem>Validator: {softwareVersions.validator}</Footer.ListItem>
            </Footer.List>
            <Footer.Copyright>&copy; Crown copyright</Footer.Copyright>
          </Footer>
        </>
      )}
    </AppContext.Consumer>
  )
}

function getSoftwareVersions(): SoftwareVersions {
  return {
    eps: "v1.0.775-beta",
    signingService: "v1.0.450-beta",
    validator: "v1.0.74-alpha"
  }
}
