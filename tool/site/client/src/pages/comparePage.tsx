import {Label, Col, Container, Row, Form, Button, Fieldset, Textarea} from "nhsuk-react-components"
import ButtonList from "../components/buttonList"
import ReactDiffViewer, {DiffMethod} from "react-diff-viewer"
import {Field, Formik} from "formik"
import {axiosInstance} from "../requests/axiosInstance"
import React, {useContext /*useState*/} from "react"
import {AppContext} from ".."
import LongRunningTask from "../components/longRunningTask"

interface ComparePrescriptions {
  prescription1: string
  prescription2: string
}

const ComparePage: React.FC = () => {
  const initialValues = {prescription1: "", prescription2: ""}
  //const [comparePrescriptions, setComparePrescriptions] = useState<ComparePrescriptions>()
  const {baseUrl} = useContext(AppContext)
  const comparePrescriptionsResponse = () => getComparePrescriptions(baseUrl)

  return (
    <>
      <Container id="pageContainer">
        <Row>
          <Col width="full"><Label isPageHeading style={{textAlign: "center"}}>Compare Prescriptions</Label></Col>
        </Row>
      </Container>
      <LongRunningTask<ComparePrescriptions> task={comparePrescriptionsResponse} loadingMessage="Compare prescriptions.">
        {compareResult => (
          compareResult.prescription1 && compareResult.prescription2
            ? <>
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
                  oldValue={compareResult.prescription1}
                  newValue={compareResult.prescription2}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS}
                />
              </div>
            </>
            : <Formik<ComparePrescriptions>
              initialValues={initialValues}
              onSubmit={null/*setComparePrescriptions*/}
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
        )}
      </LongRunningTask>

    </>
  )
}

async function getComparePrescriptions(
  baseUrl: string
): Promise<ComparePrescriptions> {
  return (await axiosInstance.get(`${baseUrl}api/compare-prescriptions`)).data
}

export default ComparePage
