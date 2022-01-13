import * as React from "react"
import {useContext} from "react"
import {Label, Table} from "nhsuk-react-components"
import {AppContext} from "../index"
import LongRunningTask from "../components/longRunningTask"
import axios from "axios"
import PrescriptionActions from "../components/prescriptionActions"
import * as fhir from "fhir/r4"

const MyPrescriptionsPage: React.FC = () => {
  const { baseUrl } = useContext(AppContext)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl)

  return (
    <LongRunningTask<Prescriptions> task={retrievePrescriptionsTask} loadingMessage="Retrieving prescriptions.">
      {prescriptions => {
        if (!prescriptions) {
          return (
            <>
              <Label isPageHeading>My Prescriptions</Label>
              <p>You do not have any active prescriptions. Once you send or release a prescription you will see it here</p>
            </>
          )
        }
        return (
          <>
            <Label isPageHeading>My Prescriptions</Label>
            <Table.Panel>
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Cell>ID</Table.Cell>
                    <Table.Cell>Continue</Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {prescriptions.summaries.map((summary, index) => <PrescriptionRow key={index} {...summary} />)}
                </Table.Body>
              </Table>
            </Table.Panel>
          </>
        )
      }}
    </LongRunningTask>
  )
}

interface Prescriptions {
  summaries: Array<PrescriptionSummary>
}

interface PrescriptionSummary {
  id: string
  status: string
}

async function retrievePrescriptions(baseUrl: string): Promise<Prescriptions> {
  return await (await axios.get<Prescriptions>(`${baseUrl}prescriptions`)).data
}

interface PrescriptionRowProps {
  id: string
  prescription?: fhir.Bundle
}

const PrescriptionRow: React.FC<PrescriptionRowProps> = ({
  id,
  prescription
}) => <Table.Row>
    <Table.Cell>{id}</Table.Cell>
    <Table.Cell>
      {getPrescriptionActions(id, prescription)}
    </Table.Cell>
  </Table.Row>

function getPrescriptionActions(id: string, bundle?: fhir.Bundle) {
  const task = getTask(bundle)
  const status = task ? task.businessStatus.coding[0].display : "To be dispensed"
  switch (status) 
  {
    case "To be dispensed":
      return <PrescriptionActions prescriptionId={id} release />
    case "With Dispenser":
      return <PrescriptionActions prescriptionId={id} dispense />
  }
  return <PrescriptionActions prescriptionId={id} view />
}


export default MyPrescriptionsPage

