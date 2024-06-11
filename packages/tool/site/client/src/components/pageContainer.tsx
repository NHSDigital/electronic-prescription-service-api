import * as React from "react"
import {Col, Container, Row} from "nhsuk-react-components"

export const PageContainer = (props: {children: React.ReactNode}) => {
  return (
    <main className="nhsuk-main-wrapper" id="maincontent" role="main">
      <Container>
        <Row>
          <Col width="full">{props.children}</Col>
        </Row>
      </Container>
    </main>
  )
}
