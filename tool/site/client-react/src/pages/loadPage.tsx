import {Field, Formik} from "formik"
import {Button, Fieldset, Form, Label, Textarea} from "nhsuk-react-components"
import * as React from "react"
import {useContext, useEffect, useState} from "react"
import BackButton from "../components/backButton"
import ButtonList from "../components/buttonList"
import RadioField from "../components/radioField"
import {AppContext} from "../index"
import {Bundle} from "fhir/r4"
import {getMedicationRequestResources} from "../fhir/bundleResourceFinder"
import {generateShortFormIdFromExisting} from "../fhir/generatePrescriptionIds"
import * as uuid from "uuid"
import {getLongFormIdExtension} from "../fhir/customExtensions"
import {convertMomentToISODate} from "../formatters/dates"
import * as moment from "moment"
import {axiosInstance} from "../requests/axiosInstance"

interface LoadFormValues {
  prescriptionPath: string
}

interface LoadResponse {
  redirectUri: string
}

const LoadPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  const initialValues: LoadFormValues = {
    prescriptionPath: "primary-care/acute/nominated-pharmacy/medical-prescriber"
  }

  const [loadFormValues, setLoadFormValues] = useState<LoadFormValues>()

  useEffect(() => {
    (async() => {
      if (loadFormValues) {
        try {
          console.log(loadFormValues)
          const bundles = await getBundles(baseUrl, loadFormValues)
          console.log(bundles)
          bundles.forEach(bundle => {
            updateBundleIds(bundle)
            updateValidityPeriodIfRepeatDispensing(bundle)
          })

          const response = await (await axiosInstance.post<LoadResponse>(`${baseUrl}prescribe/edit`, bundles)).data
          
          if (response.redirectUri) {
            window.location.href = encodeURI(response.redirectUri)
          } else {
            console.log("Failed to read prescription(s)")
          }
        } catch (e) {
          console.log(e)
          console.log("Failed to read prescription(s)")
        }
      }
    })()
  }, [baseUrl, loadFormValues])

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
                // {
                //   value: "custom",
                //   text: "Custom"
                // }
              ]}
            />
            {formik.values.prescriptionPath === "custom" && 
              <Field
                id="prescriptionTextArea"
                name="prescriptionTextArea"
                as={Textarea}
                rows={20}
              />
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

function updateBundleIds(bundle: Bundle): void {
  const firstGroupIdentifier = getMedicationRequestResources(bundle)[0].groupIdentifier
  const originalShortFormId = firstGroupIdentifier.value

  const newShortFormId = generateShortFormIdFromExisting(originalShortFormId)
  const newLongFormId = uuid.v4()

  bundle.identifier.value = uuid.v4()
  getMedicationRequestResources(bundle).forEach(medicationRequest => {
    medicationRequest.identifier[0].value = uuid.v4()
    const groupIdentifier = medicationRequest.groupIdentifier
    groupIdentifier.value = newShortFormId
    getLongFormIdExtension(groupIdentifier.extension).valueIdentifier.value = newLongFormId
  })
}

function updateValidityPeriodIfRepeatDispensing(bundle: Bundle): void {
  if (isRepeatDispensing(bundle)) {
    const start = convertMomentToISODate(moment.utc())
    const end = convertMomentToISODate(moment.utc().add(1, "month"))
    getMedicationRequestResources(bundle).forEach(request => {
      const validityPeriod = request.dispenseRequest.validityPeriod
      validityPeriod.start = start
      validityPeriod.end = end
    })
  }
}

function isRepeatDispensing(bundle: Bundle): boolean {
  return getMedicationRequestResources(bundle)
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .some(coding => coding.code === "continuous-repeat-dispensing")
}

async function getBundles(
  baseUrl: string,
  loadFormValues: LoadFormValues
): Promise<Array<Bundle>> {

  if (loadFormValues.prescriptionPath === "custom") {
    return []
  }

  const prescription = await (await axiosInstance.get<Bundle>(
    `${baseUrl}static/examples/${loadFormValues.prescriptionPath}/1-Prepare-Request-200_OK.json`
  )).data

  return [prescription]
}

export default LoadPage
