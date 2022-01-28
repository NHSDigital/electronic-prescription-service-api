
import {Field, Formik} from "formik"
import {Button, Fieldset, Form, Input, Label, Textarea} from "nhsuk-react-components"
import * as React from "react"
import {useContext, useEffect, useState} from "react"
import BackButton from "../components/backButton"
import ButtonList from "../components/buttonList"
import RadioField from "../components/radioField"
import {AppContext} from "../index"
import {Bundle} from "fhir/r4"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {createPrescriptionsFromExcelFile} from "../services/test-pack"
import {readPrescriptionsFromFiles} from "../services/file-upload"
import {updateBundleIds, updateValidityPeriodIfRepeatDispensing} from "../fhir/helpers"

interface LoadFormValues {
  prescriptionPath: string
  prescriptionTextArea?: string
}

interface LoadResponse {
  redirectUri: string
}

function isLoadResponse(response: unknown): response is LoadResponse {
  return (response as LoadResponse).redirectUri !== undefined
}

const LoadPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  const initialValues: LoadFormValues = {
    prescriptionPath: "primary-care/acute/nominated-pharmacy/medical-prescriber"
  }

  const [prescriptionFilesUploaded, setPrescriptionFilesUploaded] = useState([])
  const [prescriptionsInTestPack, setPrescriptionsInTestPack] = useState([])
  const [loadFormValues, setLoadFormValues] = useState<LoadFormValues>()

  useEffect(() => {
    (async() => {
      if (loadFormValues) {
        const bundles = await getBundles(baseUrl, loadFormValues, prescriptionsInTestPack, prescriptionFilesUploaded)

        if (!bundles.length) {
          throw new Error("Unable to read prescription(s)")
        }

        bundles.forEach(bundle => {
          updateBundleIds(bundle)
          updateValidityPeriodIfRepeatDispensing(bundle)
        })

        const response = await (await axiosInstance.post<LoadResponse>(`${baseUrl}prescribe/edit`, bundles))
        const responseData = getResponseDataIfValid(response, isLoadResponse)
        window.location.href = encodeURI(responseData.redirectUri)
      }
    })()
  }, [baseUrl, loadFormValues, prescriptionsInTestPack, prescriptionFilesUploaded])

  function uploadPrescriptionFiles(target: EventTarget): void {
    const files = (target as HTMLInputElement).files
    if (!files.length) {
      return
    }
    readPrescriptionsFromFiles(files, prescriptionFilesUploaded, setPrescriptionFilesUploaded)
  }

  function uploadPrescriptionTestPack(target: EventTarget) {
    const files = (target as HTMLInputElement).files
    createPrescriptionsFromExcelFile(files[0], setPrescriptionsInTestPack)
  }

  return (
    <>
      <Label isPageHeading>Load prescription</Label>
      <Formik<LoadFormValues> onSubmit={setLoadFormValues} initialValues={initialValues}>
        {formik =>
          <Form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>
            <Fieldset>
              <RadioField
                name="prescriptionPath"
                label="Select a prescription to load"
                defaultValue={initialValues.prescriptionPath}
                fieldRadios={[
                  {
                    value: "primary-care/acute/nominated-pharmacy/medical-prescriber",
                    text: "Primary Care - Acute (nominated)"
                  },
                  {
                    value: "primary-care/repeat-prescribing",
                    text: "Primary Care - Repeat Prescribing (nominated)"
                  },
                  {
                    value: "primary-care/repeat-dispensing/nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/medication-list/din",
                    text: "Primary Care - Repeat Dispensing (nominated)"
                  },
                  {
                    value: "secondary-care/community/acute/nominated-pharmacy/clinical-practitioner",
                    text: "Secondary Care - Acute (nominated)"
                  },
                  {
                    value: "secondary-care/community/acute/no-nominated-pharmacy/clinical-practitioner",
                    text: "Secondary Care - Acute"
                  },
                  {
                    value: "secondary-care/community/repeat-dispensing/nominated-pharmacy/clinical-practitioner/single-medication-request",
                    text: "Secondary Care - Repeat Dispensing (nominated)"
                  },
                  {
                    value: "secondary-care/homecare/acute/nominated-pharmacy/clinical-practitioner",
                    text: "Homecare - Acute (nominated)"
                  },
                  {
                    value: "custom",
                    text: "Custom"
                  }
                ]}
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
                <Input
                  type="file"
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={e => uploadPrescriptionTestPack(e.target)}
                />
                <Label>Upload FHIR prescription files</Label>
                <Input
                  type="file"
                  multiple
                  accept="application/json"
                  onChange={e => uploadPrescriptionFiles(e.target)}
                />
              </>
              }
            </Fieldset>
            <ButtonList>
              <Button type="submit">View</Button>
              <BackButton />
            </ButtonList>
          </Form>
        }
      </Formik>
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

    const filePrescriptions = prescriptionFilesUploaded.filter(Boolean)
    const testPackPrescriptions = prescriptionsInTestPack.filter(Boolean)

    return [textPrescription, ...filePrescriptions, ...testPackPrescriptions]
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

  const examplePrescription = await (await axiosInstance.get<Bundle>(
    `${baseUrl}static/examples/${loadFormValues.prescriptionPath}/1-Prepare-Request-200_OK.json`
  )).data

  return [examplePrescription]
}

export default LoadPage
