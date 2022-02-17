import * as React from "react"
import {useState} from "react"
import {Label, Col, Container, Row, Form, Button, Fieldset, Textarea} from "nhsuk-react-components"
import ButtonList from "../components/buttonList"
import ReactDiffViewer, {DiffMethod} from "react-diff-viewer"
import {Field, Formik} from "formik"

interface Prescriptions {
  prescription1: string
  prescription2: string
}

const ComparePage: React.FC = () => {
  const initialValues = {prescription1: "", prescription2: ""}
  const [prescriptions, setPrescriptions] = useState<Prescriptions>()

  if (!prescriptions) {
    return (
      <>
        <Container id="pageContainer">
          <Row>
            <Col width="full"><Label isPageHeading style={{textAlign: "center"}}>Compare Prescriptions</Label></Col>
          </Row>
        </Container>
        <Formik<Prescriptions>
          initialValues={initialValues}
          onSubmit={setPrescriptions}
        >
          {formik =>
            <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
              <Fieldset>
                <Field
                  id="prescription1"
                  name="prescription1"
                  as={Textarea}
                  rows={20}
                />
                <Field
                  id="prescription2"
                  name="prescription2"
                  as={Textarea}
                  rows={20}
                />
              </Fieldset>
              <ButtonList>
                <Button type="submit">Compare</Button>
              </ButtonList>
            </Form>
          }
        </Formik>
      </>
    )
  }

  return (
    <>
      <style>{"#pageContainer {max-width: 2200px} pre {word-break: break-word}"}</style>
      <Container id="pageContainer">
        <Row>
          <Col width="full">
            <Label isPageHeading style={{textAlign: "center"}}>
                Compare Prescriptions
            </Label>
          </Col>
        </Row>
      </Container>
      <div style={{width: "100%", margin: "10 0"}}>
        <ReactDiffViewer
          oldValue={prescriptions.prescription1}
          newValue={prescriptions.prescription2}
          splitView={true}
          compareMethod={DiffMethod.WORDS}
        />
      </div>
    </>
  )
}

export default ComparePage
