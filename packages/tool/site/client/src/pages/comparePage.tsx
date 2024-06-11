import {Label, Form, Button, Fieldset, Textarea} from "nhsuk-react-components"
import ButtonList from "../components/common/buttonList"
import ReactDiffViewer, {DiffMethod} from "react-diff-viewer-continued"
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
        {
          compareResult => {
            const compareResultReady = compareResult.prescription1 && compareResult.prescription2
            if (compareResultReady){
              return <CompareResult compareResult={compareResult} />
            }

            const comparePrescriptionsReady = comparePrescriptions.prescription1 && comparePrescriptions.prescription2
            if(comparePrescriptionsReady){
              return <CompareSelectedPrescriptions comparePrescriptions={comparePrescriptions} />
            }

            return <PrescriptionSelection initialValues={initialValues} onSubmit={values => setComparePrescriptions(values)}/>
          }
        }
      </LongRunningTask>
    </>
  )
}

const CompareResult = compareResult => {
  return (
    <>
      <style>{"pre {word-break: break-word}"}</style>
      <ReactDiffViewer
        oldValue={compareResult.prescription1}
        newValue={compareResult.prescription2}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
      />
    </>
  )
}

const CompareSelectedPrescriptions = comparePrescriptions => {
  return (
    <>
      <style>{"pre {word-break: break-word}"}</style>
      <ReactDiffViewer
        oldValue={comparePrescriptions.prescription1}
        newValue={comparePrescriptions.prescription2}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
      />
    </>
  )
}

const PrescriptionSelection = (intialValues, onSubmit) => {
  return (
    <Formik<ComparePrescriptions>
      initialValues = {intialValues}
      onSubmit={onSubmit}
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
