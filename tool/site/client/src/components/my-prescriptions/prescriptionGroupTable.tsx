import {Checkboxes, Table} from "nhsuk-react-components"
import React, {useContext} from "react"
import {AppContext} from "../.."
import {axiosInstance} from "../../requests/axiosInstance"
import PrescriptionActions from "../prescriptionActions"

interface PrescriptionGroupTableProps {
  name: string
  description: string
  prescriptions: Array<string>
  actions: PrescriptionActionProps
}

interface PrescriptionActionProps {
  view?: boolean
  release?: boolean
  verify?: boolean
  releaseReturn?: boolean
  withdraw?: boolean
  dispense?: boolean
  claim?: boolean
}

export const PrescriptionGroupTable: React.FC<PrescriptionGroupTableProps> = ({
  name,
  description,
  prescriptions,
  actions
}) => {
  const {baseUrl} = useContext(AppContext)
  if (!prescriptions.length) {
    return null
  }
  return (
    <Table.Panel heading={name}>
      <Table caption={description}>
        <Table.Head>
          <Table.Row>
            <Table.Cell>ID</Table.Cell>
            <Table.Cell>Actions</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {prescriptions.map((prescription, index) =>
            <Table.Row key={index}>
              <Table.Cell>{prescription}</Table.Cell>
              <Table.Cell>
                <PrescriptionActions prescriptionId={prescription} {...actions} />
                <Checkboxes id={`prescription.${prescription}`}>
                  <Checkboxes.Box
                    id={`prescription.${prescription}.box`}
                    name={`prescription.${prescription}.box`}
                    type="checkbox"
                    onClick={() => addToComparePrescriptions(baseUrl, prescription)}
                  >
                    Add to Compare
                  </Checkboxes.Box>
                </Checkboxes>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

// todo: own component
async function addToComparePrescriptions(baseUrl: string, prescriptionId: string) {
  await axiosInstance.post(`${baseUrl}compare-prescriptions`, {prescriptionId})
}
