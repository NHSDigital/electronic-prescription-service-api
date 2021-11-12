import * as React from "react"
import {useState} from "react"
import {Button, ErrorMessage, Form, Label} from "nhsuk-react-components"
import {Bundle, Task} from "fhir/r4"
import {
  createPrescriptionDetailProps,
  PrescriptionDetails
} from "../components/prescription-tracker/detail/prescriptionDetails"
import {
  createPrescriptionItemProps,
  PrescriptionItems
} from "../components/prescription-tracker/detail/prescriptionItems"
import ButtonList from "../components/buttonList"
import {Field, Formik} from "formik"
import {MaskedInput} from "nhsuk-react-components-extensions"
import TrackerSummaryTable from "../components/prescription-tracker/summary/trackerSummaryTable"
import {MessageExpander} from "../components/messageExpanders"
import {isBundle, isOperationOutcome, isTask} from "../fhir/typeGuards"

interface PrescriptionSearchPageProps {
  baseUrl: string
  prescriptionId?: string
}

interface PrescriptionSearchCriteria {
  prescriptionId?: string
  patientId?: string
}

const PrescriptionSearchPage: React.FC<PrescriptionSearchPageProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [searchResults, setSearchResults] = useState<Bundle>()
  const [selectedPrescription, setSelectedPrescription] = useState<Task>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [loadingMessage, setLoadingMessage] = useState<string>()

  async function handleSearch(searchCriteria: PrescriptionSearchCriteria) {
    setLoadingMessage("Searching for prescriptions.")

    const bundle = await makeTrackerRequest(searchCriteria)
    if (bundle) {
      setSearchResults(bundle)
    }

    setLoadingMessage(undefined)
  }

  async function selectPrescription(selectedPrescriptionId: string) {
    const selectedTask = getTasks(searchResults).find(task => task.focus.identifier.value === selectedPrescriptionId)
    if (selectedTask.owner) {
      setSelectedPrescription(selectedTask)
      return
    }

    setLoadingMessage("Retrieving full prescription details.")

    const bundle = await makeTrackerRequest({prescriptionId: selectedPrescriptionId})
    if (bundle) {
      const tasks = getTasks(bundle)
      setSelectedPrescription(tasks[0])
    }

    setLoadingMessage(undefined)
  }

  async function makeTrackerRequest(searchCriteria: PrescriptionSearchCriteria): Promise<Bundle | undefined> {
    const searchParams = toURLSearchParams(searchCriteria)
    const response = await fetch(`${baseUrl}tracker?${searchParams.toString()}`)
    const responseData = await response.json()
    if (isBundle(responseData)) {
      return responseData
    } else if (isOperationOutcome(responseData)) {
      setErrorMessage(responseData.issue[0].diagnostics)
    } else {
      console.log(responseData)
      setErrorMessage("Unknown error")
    }
  }

  function handleReset() {
    setSearchResults(undefined)
    setSelectedPrescription(undefined)
    setErrorMessage(undefined)
    setLoadingMessage(undefined)
  }

  const initialValues = {
    prescriptionId: prescriptionId ?? "",
    patientId: ""
  }

  if (errorMessage) {
    return <>
      <Label isPageHeading>Error</Label>
      <ErrorMessage>{errorMessage}</ErrorMessage>
      <ButtonList>
        <Button secondary onClick={handleReset}>Back</Button>
      </ButtonList>
    </>
  }

  if (loadingMessage) {
    return <>
      <Label isPageHeading>Loading...</Label>
      <Label>{loadingMessage}</Label>
    </>
  }

  if (selectedPrescription) {
    const prescription = createPrescriptionDetailProps(selectedPrescription)
    const prescriptionItems = createPrescriptionItemProps(selectedPrescription)
    return <>
      <Label isPageHeading>Prescription Details</Label>
      <PrescriptionDetails {...prescription} />
      <PrescriptionItems items={prescriptionItems}/>
      <MessageExpander
        name="Response (FHIR)"
        message={JSON.stringify(selectedPrescription, null, 2)}
        mimeType="application/json"
      />
      <ButtonList>
        <Button secondary onClick={() => setSelectedPrescription(undefined)}>Back</Button>
      </ButtonList>
    </>
  }

  if (searchResults) {
    const prescriptions = getTasks(searchResults).map(task => createPrescriptionDetailProps(task))
    return <>
      <Label isPageHeading>Search Results</Label>
      {prescriptions.length
        ? <TrackerSummaryTable prescriptions={prescriptions} selectPrescription={selectPrescription}/>
        : <Label>No results found.</Label>
      }
      <MessageExpander
        name="Response (FHIR)"
        message={JSON.stringify(searchResults, null, 2)}
        mimeType="application/json"
      />
      <ButtonList>
        <Button secondary onClick={handleReset}>Back</Button>
      </ButtonList>
    </>
  }

  //TODO - move to separate component
  return (
    <Formik<PrescriptionSearchCriteria> initialValues={initialValues} onSubmit={values => handleSearch(values)}>
      {formik => (
        <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
          <Label isPageHeading>Search for a Prescription</Label>
          <Field
            id="prescriptionId"
            name="prescriptionId"
            label="Prescription ID"
            hint="Use the short form here, e.g. E3E6FA-A83008-41F09Y"
            width={20}
            mask="******-******-******"
            maskChar=""
            autoComplete="off"
            as={MaskedInput}
          />
          <Field
            id="patientId"
            name="patientId"
            label="NHS Number"
            width={10}
            mask="999 999 9999"
            maskChar=""
            autoComplete="off"
            as={MaskedInput}
          />
          <ButtonList>
            <Button type="submit">Search</Button>
            <Button secondary href={baseUrl}>Back</Button>
          </ButtonList>
        </Form>
      )}
    </Formik>
  )
}

function toURLSearchParams(searchCriteria: PrescriptionSearchCriteria) {
  const searchParams = new URLSearchParams()
  if (searchCriteria.prescriptionId) {
    const prescriptionIdForSearch = searchCriteria.prescriptionId.toUpperCase()
    searchParams.set("focus:identifier", prescriptionIdForSearch)
  }
  if (searchCriteria.patientId) {
    const patientIdForSearch = searchCriteria.patientId.replace(/ /g, "")
    searchParams.set("patient:identifier", patientIdForSearch)
  }
  return searchParams
}

function getTasks(bundle: Bundle): Array<Task> {
  return bundle.entry
    .map(entry => entry.resource)
    .filter(isTask)
}

export default PrescriptionSearchPage
