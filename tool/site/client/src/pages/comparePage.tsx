import {Label, Form, Button, Fieldset, Textarea} from "nhsuk-react-components"
import ButtonList from "../components/common/buttonList"
import ReactDiffViewer, {DiffMethod} from "react-diff-viewer"
import {Field, Formik} from "formik"
import {axiosInstance} from "../requests/axiosInstance"
import React, {useContext, useState} from "react"
import {AppContext} from ".."
import LongRunningTask from "../components/common/longRunningTask"

interface ComparePrescriptions {
  prescription1: string
  prescription2: string
}

const ComparePage: React.FC = () => {
  const initialValues = {prescription1: "", prescription2: ""}
  const [comparePrescriptions, setComparePrescriptions] = useState<ComparePrescriptions>(initialValues)
  const {baseUrl} = useContext(AppContext)
  const comparePrescriptionsResponse = () => getComparePrescriptions(baseUrl)

  return (
    <>
      <Label isPageHeading style={{textAlign: "center"}}>Compare Prescriptions</Label>
      <LongRunningTask<ComparePrescriptions> task={comparePrescriptionsResponse} loadingMessage="Compare prescriptions.">
        {compareResult => (
          compareResult.prescription1 && compareResult.prescription2
            ? <>
              <style>{"pre {word-break: break-word}"}</style>
              <ReactDiffViewer
                oldValue={compareResult.prescription1}
                newValue={compareResult.prescription2}
                splitView={true}
                compareMethod={DiffMethod.WORDS}
              />
            </>
            : comparePrescriptions.prescription1 && comparePrescriptions.prescription2
              ? <>
                <style>{"pre {word-break: break-word}"}</style>
                <ReactDiffViewer
                  oldValue={compareResult.prescription1}
                  newValue={compareResult.prescription2}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS}
                />
              </>
              : <Formik<ComparePrescriptions>
                initialValues={initialValues}
                onSubmit={values => setComparePrescriptions(values)}
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
                    <ButtonList style={{display: "flex", justifyContent: "center"}}>
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
  const comparePrescriptions = (await axiosInstance.get(`${baseUrl}api/compare-prescriptions`)).data
  await axiosInstance.post(`${baseUrl}api/reset-compare-prescriptions`)
  return comparePrescriptions
}

export default ComparePage
