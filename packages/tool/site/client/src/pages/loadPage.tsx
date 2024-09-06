import {Field, Formik} from "formik"
import {Button, Fieldset, Form, TextInput, Label, Textarea, ErrorSummary} from "nhsuk-react-components"
import * as React from "react"
import {useContext, useEffect, useState} from "react"
import BackButton from "../components/common/backButton"
import ButtonList from "../components/common/buttonList"
import RadioField from "../components/common/radioField"
import {AppContext} from "../index"
import {Bundle} from "fhir/r4"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {createPrescriptionsFromExcelFile} from "../services/test-packs"
import {readPrescriptionsFromFiles} from "../services/file-upload"
import {updateBundleIds, updateValidityPeriod} from "../fhir/helpers"
import styled from "styled-components"
import {Spinner} from "../components/common/loading"
import {SHA1} from "crypto-js"

interface LoadFormValues {
  prescriptionPath: string
  prescriptionTextArea?: string
}

interface LoadResponse {
  redirectUri: string
}

interface LoadPageErrors {
  details: Array<string>
}

function isLoadResponse(response: unknown): response is LoadResponse {
  return (response as LoadResponse).redirectUri !== undefined
}

const StyledErrorSummaryItem = styled(ErrorSummary.Item)`
  color: black;
`

const LoadPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  const initialValues: LoadFormValues = {
    prescriptionPath: "primary-care/acute/nominated-pharmacy/medical-prescriber"
  }

  const [prescriptionFilesUploaded, setPrescriptionFilesUploaded] = useState([])
  const [prescriptionsInTestPack, setPrescriptionsInTestPack] = useState([])
  const [loadFormValues, setLoadFormValues] = useState<LoadFormValues>()
  const [loadPageErrors, setLoadPageErrors] = useState<LoadPageErrors>({details:[]})
  const [uploadingTestPack, setUploadingTestPack] = useState<boolean>(false)

  useEffect(() => {
    (async() => {
      if (loadFormValues) {
        if (prescriptionsInTestPack.length > 0) {
          setUploadingTestPack(true)
        }

        setLoadPageErrors({details: []})

        const bundles = await getBundles(baseUrl, loadFormValues, prescriptionsInTestPack, prescriptionFilesUploaded)

        if (!bundles.length) {
          setLoadPageErrors({details: ["Unable to read prescription(s)"]})
        }

        bundles.forEach(bundle => {
          updateBundleIds(bundle)
          updateValidityPeriod(bundle)
        })

        // clear out old prescriptions
        await axiosInstance.post(`${baseUrl}prescribe/reset`)

        // upload prescriptions in batches
        const loadResponses = await uploadBundlesInBatches(bundles, 10)

        window.location.href = encodeURI(loadResponses[0].redirectUri)
      }

      async function uploadBundlesInBatches(bundles: Bundle[], batchSize: number) {
        const loadResponses: Array<LoadResponse> = []
        for (let i = 0; i < bundles.length; i += batchSize) {
          const batch = bundles.slice(i, i + batchSize)
          const response = await axiosInstance.post<LoadResponse>(`${baseUrl}prescribe/edit`, batch)
          loadResponses.push(getResponseDataIfValid(response, isLoadResponse))
        }
        return loadResponses
      }
    })()
  }, [baseUrl, loadFormValues, prescriptionsInTestPack, prescriptionFilesUploaded, setLoadPageErrors])

  function uploadPrescriptionFiles(target: EventTarget): void {
    setLoadPageErrors({details: []})
    setPrescriptionFilesUploaded(undefined)

    const files = (target as HTMLInputElement).files
    if (!files.length) {
      return
    }
    readPrescriptionsFromFiles(files, prescriptionFilesUploaded, setPrescriptionFilesUploaded)
  }

  function uploadPrescriptionTestPack(target: EventTarget) {
    setLoadPageErrors({details: []})
    setPrescriptionsInTestPack(undefined)

    const files = (target as HTMLInputElement).files
    createPrescriptionsFromExcelFile(files[0], setPrescriptionsInTestPack, setLoadPageErrors)
  }

  return (
    <>
      <Label isPageHeading>Load prescription(s)</Label>
      <Formik<LoadFormValues> onSubmit={setLoadFormValues} initialValues={initialValues}>
        {formik =>
          <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
            <Fieldset>
              <RadioField
                name="prescriptionPath"
                label="Select a prescription to load"
                onClick={() => setLoadPageErrors({details: []})}
                defaultValue={initialValues.prescriptionPath}
                fieldRadios={[
                  {
                    value: "primary-care/acute/nominated-pharmacy/medical-prescriber",
                    text: "Primary Care - Acute (nominated)"
                  },
                  {
                    value: "custom",
                    text: "Custom"
                  }
                ].map((option, index) => ({...option, id: index}))}
              />
              {formik.values.prescriptionPath === "custom" &&
              <>
                <Label>Paste a FHIR prescription</Label>
                <Field
                  id="prescriptionTextArea"
                  name="prescriptionTextArea"
                  as={Textarea}
                  rows={10}
                />
                <Label>Upload Test Pack</Label>
                <TextInput
                  type="file"
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={e => uploadPrescriptionTestPack(e.target)}
                />
                <Label>Upload FHIR prescription files</Label>
                <TextInput
                  type="file"
                  multiple
                  accept="application/json"
                  onChange={e => uploadPrescriptionFiles(e.target)}
                />
              </>
              }
            </Fieldset>
            <ButtonList>
              {(loadFormValues && !!loadPageErrors.details.length) || uploadingTestPack
                ? <Spinner/>
                : <>
                  <Button type="submit">View</Button>
                  <BackButton />
                </>
              }
            </ButtonList>
          </Form>
        }
      </Formik>
      {!!loadPageErrors.details.length &&
        <ErrorSummary aria-labelledby="error-summary-title" role="alert" tabIndex={-1}>
          <ErrorSummary.Title id="error-summary-title">The following error(s) occured</ErrorSummary.Title>
          <ErrorSummary.Body>
            {loadPageErrors.details.map(detail =>
              <StyledErrorSummaryItem key={SHA1(`${detail}`).toString()}>{detail}</StyledErrorSummaryItem>
            )}
            <ErrorSummary.List>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      }
    </>
  )
}

async function getBundles(
  baseUrl: string,
  loadFormValues: LoadFormValues,
  prescriptionsInTestPack: Array<string>,
  prescriptionFilesUploaded: Array<string>
): Promise<Array<Bundle>> {

  if (loadFormValues.prescriptionPath === "custom") {

    const textPrescription =
      loadFormValues.prescriptionTextArea
        ? loadFormValues.prescriptionTextArea
        : undefined

    return [textPrescription, ...prescriptionFilesUploaded, ...prescriptionsInTestPack]
      .filter(Boolean)
      .map(string => {
        let bundle: Bundle
        try {
          bundle = JSON.parse(string)
          if (!bundle.entry.length) {
            throw new Error()
          }
        } catch {
          return null
        }
        return bundle
      })
      .filter(Boolean)
  }

  const examplePrescription = (await axiosInstance.get<Bundle>(
    `${baseUrl}static/examples/${loadFormValues.prescriptionPath}/1-Prepare-Request-200_OK.json`
  )).data

  return [examplePrescription]
}

export default LoadPage
