import * as React from "react"
import {useState} from "react"
import {Button, Details, Form, Label} from "nhsuk-react-components"
import Pre from "../pre"
import {Bundle, OperationOutcome, Task} from "fhir/r4"
import {createPrescriptionProps, PrescriptionProps} from "./prescription"
import {PrescriptionDetails} from "./prescriptionDetails"
import {PrescriptionItems} from "./prescriptionItems"
import ButtonList from "../buttonList"
import {Field, Formik} from "formik"
import {MaskedInput} from "nhsuk-react-components-extensions"

interface PrescriptionSearchProps {
  baseUrl: string
  prescriptionId?: string
}

interface PrescriptionSearchCriteria {
  prescriptionId: string
  patientId: string
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

interface PrescriptionSearchResults {
  response: Bundle | OperationOutcome
  count: number
  pluralSuffix: string
  prescriptions: Array<PrescriptionProps>
}

const PrescriptionSearch: React.FC<PrescriptionSearchProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [searchResults, setSearchResults] = useState<PrescriptionSearchResults>(null)

  async function handleSearch(searchCriteria: PrescriptionSearchCriteria) {
    const searchParams = toURLSearchParams(searchCriteria)
    const response = await fetch(`${baseUrl}tracker?${searchParams.toString()}`)
    //TODO - check for error response
    const bundle: Bundle = await response.json()
    const results: PrescriptionSearchResults = {
      response: bundle,
      count: bundle.total,
      //TODO - remove?
      pluralSuffix: bundle.total > 1 || bundle.total === 0 ? "s" : "",
      prescriptions: bundle.entry?.map(e => e.resource as Task).map(createPrescriptionProps)
    }
    setSearchResults(results)
  }

  function handleReset() {
    setSearchResults(null)
  }

  const initialValues = {
    prescriptionId: prescriptionId ?? "",
    patientId: ""
  }

  if (!searchResults) {
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

  return <>
    <Label isPageHeading>Found {searchResults.count} Prescription{searchResults.pluralSuffix}</Label>
    {/* todo: handle multiple prescriptions */}
    {searchResults.prescriptions && (
      <>
        <PrescriptionDetails {...searchResults.prescriptions[0]} />
        <PrescriptionItems {...searchResults.prescriptions[0]} />
      </>
    )}
    <Details expander>
      <Details.Summary>Show FHIR</Details.Summary>
      <Details.Text>
        <Pre>{JSON.stringify(searchResults.response, null, 2)}</Pre>
      </Details.Text>
    </Details>
    <ButtonList>
      {/*TODO - what is the refresh button for?*/}
      {/*<Button onClick={handleSearch}>Refresh</Button>*/}
      <Button secondary onClick={handleReset}>Back</Button>
    </ButtonList>
  </>
}

export default PrescriptionSearch
