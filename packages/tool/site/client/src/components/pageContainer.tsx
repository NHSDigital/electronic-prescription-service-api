import * as React from "react"
import {Col, Container, Row} from "nhsuk-react-components"

interface PageContainerProps {
  children?: React.ReactNode
}

export const PageContainer: React.FC = (props: PageContainerProps) => {
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
