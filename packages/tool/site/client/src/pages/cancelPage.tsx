import * as React from "react"
import {useContext, useState} from "react"
import {Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import * as fhir from "fhir/r4"
import PrescriptionActions from "../components/common/prescriptionActions"
import MessageExpanders from "../components/messageExpanders"
import ReloadButton from "../components/common/reloadButton"
import axios from "axios"
import CancelForm, {CancelFormValues, cancellationReasons, MedicationRadio} from "../components/cancel/cancelForm"
import {getMedicationRequestResources, getMessageHeaderResources, getPractitionerResources, getPractitionerRoleResources} from "../fhir/bundleResourceFinder"
import {createIdentifier, orderBundleResources} from "../fhir/helpers"
import * as uuid from "uuid"
import SuccessOrFail from "../components/common/successOrFail"
import {makePrescriptionTrackerRequest} from "../common/prescription"

interface CancelPageProps {
  prescriptionId?: string
}

const CancelPage: React.FC<CancelPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [cancelFormValues, setCancelFormValues] = useState<CancelFormValues>()
  const retrievePrescriptionTask = () => retrievePrescriptionDetails(baseUrl, prescriptionId)

  return (
    <LongRunningTask<PrescriptionDetails> task={retrievePrescriptionTask} loadingMessage="Retrieving prescription details.">
      {prescriptionDetails => {
        if (!cancelFormValues) {
          const medications = createStaticMedicationArray(
            prescriptionDetails.medicationRequests
          )
          return (
            <>
              <Label isPageHeading>Cancel Prescription</Label>
              <CancelForm medications={medications} onSubmit={setCancelFormValues} />
            </>
          )
        }

        const sendCancelTask = () => sendCancel(baseUrl, prescriptionDetails, cancelFormValues)
        return (
          <LongRunningTask<CancelResult> task={sendCancelTask} loadingMessage="Sending cancellation.">
            {cancelResult => (
              <>
                <Label isPageHeading>Cancel Result {<SuccessOrFail condition={cancelResult.success} />}</Label>
                <PrescriptionActions prescriptionId={prescriptionId} statusView />
                <MessageExpanders
                  fhirRequest={cancelResult.request}
                  hl7V3Request={cancelResult.request_xml}
                  hl7V3Response={cancelResult.response_xml}
                  fhirResponse={cancelResult.response}
                />
                <ButtonList>
                  <ReloadButton />
                </ButtonList>
              </>
            )}
          </LongRunningTask>
        )
      }}
    </LongRunningTask>
  )
}

async function retrievePrescriptionDetails(
  baseUrl: string,
  prescriptionId: string,
  repeatNumber?: string
): Promise<PrescriptionDetails> {
  const searchParams = {prescriptionId, repeatNumber}
  const prescriptionOrder = await makePrescriptionTrackerRequest(baseUrl, searchParams)
  if (!prescriptionOrder) {
    throw new Error("Prescription order not found. Is the ID correct?")
  }

  return {
    bundle: prescriptionOrder,
    medicationRequests: getMedicationRequestResources(prescriptionOrder)
  }
}

function createStaticMedicationArray(
  medicationRequests: Array<fhir.MedicationRequest>
): Array<MedicationRadio> {
  return medicationRequests.map(medicationRequest => {
    const medicationCodeableConceptCoding = medicationRequest.medicationCodeableConcept.coding[0]
    return {
      value: medicationCodeableConceptCoding.code,
      text: medicationCodeableConceptCoding.display
    }
  })
}

async function sendCancel(
  baseUrl: string,
  prescriptionDetails: PrescriptionDetails,
  cancelFormValues: CancelFormValues
): Promise<CancelResult> {
  const cancel = createCancel(prescriptionDetails, cancelFormValues)

  const response = await axios.post<CancelResult>(`${baseUrl}prescribe/cancel`, cancel)

  return response.data
}

function createCancel(prescriptionDetails: PrescriptionDetails, cancelFormValues: CancelFormValues): fhir.Bundle {
  const cancelRequest = prescriptionDetails.bundle
  cancelRequest.identifier = createIdentifier()

  const messageHeader = getMessageHeaderResources(cancelRequest)[0]
  messageHeader.eventCoding.code = "prescription-order-update"
  messageHeader.eventCoding.display = "Prescription Order Update"
  messageHeader.response = null
  messageHeader.focus = []

  const medicationToCancelSnomed = cancelFormValues.cancellationMedication
  const medicationRequests = getMedicationRequestResources(prescriptionDetails.bundle)
  const medicationToCancel = medicationRequests.filter(medicationRequest =>
    medicationRequest.medicationCodeableConcept.coding.some(
      c => c.code === medicationToCancelSnomed
    )
  )[0]
  medicationToCancel.status = "cancelled"
  const cancellationReason = cancelFormValues.cancellationReason
  medicationToCancel.statusReason = {
    coding: [
      {
        system:
          "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
        code: cancellationReason,
        display: cancellationReasons.find(r => r.value === cancellationReason).text
      }
    ]
  }

  if (cancellingWithAdminUser(cancelFormValues)) {
    const cancelPractitionerRoleIdentifier = uuid.v4()
    const cancelPractitionerIdentifier = uuid.v4()

    addReferenceToCancellerInMedicationRequest(medicationToCancel, cancelPractitionerRoleIdentifier)

    const practitionerRole = getPractitionerRoleResources(cancelRequest)[0]
    const cancelPractitionerRoleEntry: fhir.BundleEntry =
      createCancellerPractitionerRole(
        cancelPractitionerRoleIdentifier,
        practitionerRole,
        cancelPractitionerIdentifier,
        cancelFormValues)
    cancelRequest.entry.push(cancelPractitionerRoleEntry)

    const practitioner = getPractitionerResources(cancelRequest)[0]
    const cancelPractitionerEntry: fhir.BundleEntry =
      createCancellerPractitioner(cancelPractitionerIdentifier, practitioner)
    cancelRequest.entry.push(cancelPractitionerEntry)
  }

  cancelRequest.entry =
    cancelRequest
      .entry
      .filter(entry =>
        singleMedicationResourceToCancel(entry, medicationToCancelSnomed)
        || filterOutOtherResources(entry)
      ).sort(orderBundleResources)

  return cancelRequest
}

interface PrescriptionDetails {
  bundle: fhir.Bundle
  medicationRequests: Array<fhir.MedicationRequest>
}

interface CancelResult {
  success: boolean
  request: fhir.Bundle
  request_xml: string
  response: fhir.OperationOutcome
  response_xml: string
}

function cancellingWithAdminUser(cancelFormValues: CancelFormValues) {
  return cancelFormValues.cancellationUser === "R8006"
}

function addReferenceToCancellerInMedicationRequest(medicationToCancel: fhir.MedicationRequest, cancelPractitionerRoleIdentifier: string) {
  medicationToCancel.extension.push({
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    valueReference: {
      reference: `urn:uuid:${cancelPractitionerRoleIdentifier}`
    }
  })
}

function createCancellerPractitioner(cancelPractitionerIdentifier: string, practitioner: fhir.Practitioner): fhir.BundleEntry {
  return {
    fullUrl: `urn:uuid:${cancelPractitionerIdentifier}`,
    resource: {
      ...clone(practitioner),
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-user-id",
          value: "555086718101"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "unknown"
        }
      ],
      name: [{
        family: "Secetary",
        given: ["Medical"],
        prefix: ["MS"]
      }]
    } as fhir.Practitioner
  }
}

function createCancellerPractitionerRole(
  cancelPractitionerRoleIdentifier: string,
  practitionerRole: fhir.PractitionerRole,
  cancelPractitionerIdentifier: string,
  cancelFormValues: CancelFormValues
): fhir.BundleEntry {
  return {
    fullUrl: `urn:uuid:${cancelPractitionerRoleIdentifier}`,
    resource: {
      ...clone(practitionerRole),
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "212304192555"
        }
      ],
      practitioner: {
        reference: `urn:uuid:${cancelPractitionerIdentifier}`
      },
      code: [{
        coding: [
          {
            system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
            code: cancelFormValues.cancellationUser,
            display: "Admin - Medical Secetary Access Role"
          }
        ]
      }]
    } as fhir.PractitionerRole
  }
}

function clone(value: any): any {
  return JSON.parse(JSON.stringify(value))
}

function singleMedicationResourceToCancel(e: fhir.BundleEntry, medicationToCancelSnomed: string): boolean {
  return (e.resource.resourceType === "MedicationRequest"
    && (e.resource as fhir.MedicationRequest)
      .medicationCodeableConcept.coding.some(c => c.code === medicationToCancelSnomed))
}

function filterOutOtherResources(entry: fhir.BundleEntry): boolean {
  return entry.resource.resourceType !== "MedicationRequest"
    && entry.resource.resourceType !== "Provenance"
}

export default CancelPage
