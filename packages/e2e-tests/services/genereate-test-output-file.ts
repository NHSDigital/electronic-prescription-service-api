import {getResourcesOfType} from "@coordinator"
import {fetcher} from "@models"
import fs from "fs"

export function generateTestOutputFile(): void {
  const sentPrescriptionDescriptions = []
  const cancelledPrescriptionDescriptions = []

  fetcher.prescriptionOrderExamples.filter(e => e.isSuccess).forEach((processCase) => {
    const processBundle = processCase.request
    const firstGroupIdentifier = getResourcesOfType.getMedicationRequests(processBundle)[0].groupIdentifier

    const shortFormId = firstGroupIdentifier.value
    sentPrescriptionDescriptions.push(`${shortFormId} - ${processCase.description}`)
  })

  fetcher.prescriptionOrderUpdateExamples.filter(e => e.isSuccess).forEach((processCase) => {
    const processBundle = processCase.request
    const firstGroupIdentifier = getResourcesOfType.getMedicationRequests(processBundle)[0].groupIdentifier

    const shortFormId = firstGroupIdentifier.value
    cancelledPrescriptionDescriptions.push(`${shortFormId} - ${processCase.description}`)
  })

  const toBeDispensedPrescriptions = sentPrescriptionDescriptions.filter(p => {
    const sentShortFormId = getShortFormId(p)
    return cancelledPrescriptionDescriptions.map(cancelledDescription =>
      getShortFormId(cancelledDescription)).indexOf(sentShortFormId) < 0
  })

  const prescriptionsTestedFileSuffix = process.env.APIGEE_ENVIRONMENT ?? "tested"
  const prescriptionsTestedFile = fs.createWriteStream(`prescriptions-${prescriptionsTestedFileSuffix}.txt`)
  prescriptionsTestedFile.write("# Prescriptions to be Dispensed")
  prescriptionsTestedFile.write("\r\n")
  toBeDispensedPrescriptions.forEach(value => prescriptionsTestedFile.write(`${value}\r\n`))
  prescriptionsTestedFile.write("\r\n")
  prescriptionsTestedFile.write("# Prescriptions which have been cancelled")
  prescriptionsTestedFile.write("\r\n")
  cancelledPrescriptionDescriptions.forEach(value => prescriptionsTestedFile.write(`${value}\r\n`))
  prescriptionsTestedFile.end()
}

function getShortFormId(description: string) {
  return description.substring(0, 20)
}
