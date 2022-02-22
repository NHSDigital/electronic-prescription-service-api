import {Label, Checkboxes, Table} from "nhsuk-react-components"
import React, {Dispatch, SetStateAction, useContext, useState} from "react"
import {AppContext} from "../.."
import {redirect} from "../../browser/navigation"
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

interface ComparePrescriptions {
  prescription1: Prescription
  prescription2: Prescription
}

interface Prescription {
  id: string
  name: string
}

export const PrescriptionGroupTable: React.FC<PrescriptionGroupTableProps> = ({
  name,
  description,
  prescriptions,
  actions
}) => {
  const {baseUrl} = useContext(AppContext)
  const [comparePrescriptions, setComparePrescriptions] = useState<ComparePrescriptions>()
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
              <Table.Cell>
                <Label>{prescription}</Label>
                <Checkboxes id={`prescription.${prescription}`}>
                  <Checkboxes.Box
                    id={`prescription.${prescription}.box`}
                    name={`prescription.${prescription}.box`}
                    type="checkbox"
                    onClick={() => addToComparePrescriptions(
                      baseUrl,
                      name,
                      prescription,
                      comparePrescriptions,
                      setComparePrescriptions
                    )}
                  >
                    Add to Compare
                  </Checkboxes.Box>
                </Checkboxes>
              </Table.Cell>
              <Table.Cell>
                <PrescriptionActions prescriptionId={prescription} {...actions} />
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

// todo: own component
async function addToComparePrescriptions(
  baseUrl: string,
  name: string,
  id: string,
  comparePrescriptions: ComparePrescriptions,
  setComparePrescriptions: Dispatch<SetStateAction<ComparePrescriptions>>
) {
  if (!comparePrescriptions.prescription1) {
    comparePrescriptions.prescription1 = {name, id}
  } else if (!comparePrescriptions.prescription2) {
    comparePrescriptions.prescription2 = {name, id}
  }
  setComparePrescriptions(comparePrescriptions)
  if (comparePrescriptions.prescription1 && comparePrescriptions.prescription2) {
    await axiosInstance.post(`${baseUrl}api/compare-prescriptions`, comparePrescriptions)
    redirect(`${baseUrl}compare-prescriptions`)
  }
}
