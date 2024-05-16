import {Checkboxes} from "nhsuk-react-components"
import React, {FormEvent, useContext} from "react"
import {AppContext} from "../.."
import {redirect} from "../../browser/navigation"
import {axiosInstance} from "../../requests/axiosInstance"

interface ComparePrescriptionsProps {
  name: string
  prescriptionId: string
}

const ComparePrescriptionCheckbox: React.FC<ComparePrescriptionsProps> = ({
  name,
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  return (
    <form>
      <Checkboxes id={`prescription.${prescriptionId}`}>
        <Checkboxes.Box
          id={`prescription.${prescriptionId}.box`}
          name={`prescription.${prescriptionId}.box`}
          type="checkbox"
          onChange={e => addToComparePrescriptions(
            baseUrl,
            name,
            prescriptionId,
            e
          )}
        >
        Add to Compare
        </Checkboxes.Box>
      </Checkboxes>
    </form>
  )
}

async function addToComparePrescriptions(
  baseUrl: string,
  name: string,
  id: string,
  event: FormEvent<HTMLInputElement>
) {
  const lowercaseNoSpaceName = name.toLowerCase().replace(" ", "_")
  const addToCompare = ((event.target) as HTMLInputElement).checked
  const removeFromCompare = !addToCompare
  if (addToCompare) {
    const comparePrescriptions = (await axiosInstance.post(`${baseUrl}api/compare-prescriptions`, {name: lowercaseNoSpaceName, id})).data
    if (comparePrescriptions.prescription1 && comparePrescriptions.prescription2) {
      redirect(`${baseUrl}compare-prescriptions`)
    }
  } else if (removeFromCompare) {
    await axiosInstance.post(`${baseUrl}api/remove-compare-prescription`, {name: lowercaseNoSpaceName, id})
  }
}

export default ComparePrescriptionCheckbox
