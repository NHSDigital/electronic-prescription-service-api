import * as React from "react"
import {ReactNode} from "react"
import {Col, Container, Footer, Header, Row} from "nhsuk-react-components"
import {AppContext} from "../index"

interface PageContainerProps {
  children?: ReactNode
}

export const PageContainer: React.FC = (props: PageContainerProps) => {
  return (
      <AppContext.Consumer>
        {({baseUrl}) => (
          <>
            <Header transactional>
              <Header.Container>
                <Header.Logo href={baseUrl}/>
                <Header.ServiceName href={baseUrl}>EPSAT - Electronic Prescription Service API Tool</Header.ServiceName>
              </Header.Container>
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
                <Footer.ListItem href={baseUrl}>{ /*TODO*/ }</Footer.ListItem>
              </Footer.List>
              <Footer.Copyright>&copy; Crown copyright</Footer.Copyright>
            </Footer>
          </>
        )} 
      </AppContext.Consumer>
  )
}
