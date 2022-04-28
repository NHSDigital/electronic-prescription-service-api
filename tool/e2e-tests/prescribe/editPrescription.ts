import {driver} from "../live.test"
import {checkPrescriptionOrganisation, editPrescriptionOrganisationUserJourney, viewPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can edit the organisation on a prescription", async () => {
    const newOrganisation = "AAAAA"
    await editPrescriptionOrganisationUserJourney(driver, newOrganisation)
    await viewPrescriptionUserJourney(driver)
    await checkPrescriptionOrganisation(driver, newOrganisation)
  })
})
