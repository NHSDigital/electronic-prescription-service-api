import * as React from "react"
import {Col, Container, Row} from "nhsuk-react-components"

interface PageFullWidthProps {
  children?: React.ReactNode
}

export const PageFullWidth: React.FC = (props: PageFullWidthProps) => {
  return (
    <main className="nhsuk-main-wrapper" id="maincontent" role="main">
      <Container fluid>
        <Row>
          <Col width="full">{props.children}</Col>
        </Row>
      </Container>
    </main>
  )
}
