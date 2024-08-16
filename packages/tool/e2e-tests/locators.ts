/* eslint-disable max-len */
import {By} from "selenium-webdriver"

export const simulatedAuthPageTitle = By.id("kc-page-title")

export const backButton = By.xpath("//*[text() = 'Back']")

export const configLink = By.linkText("EPSAT - Electronic Prescription Service API Tool")
export const configPageTitle = By.xpath("//*[text() = 'Config']")
export const configButton = By.xpath("//*[text() = 'Save']")

export const homeNavLink = By.xpath("//*[text() = 'Home']")
export const myPrescriptionsNavLink = By.xpath("//*[text() = 'My Prescriptions']")
export const logoutNavLink = By.linkText("Logout")

export const logoutPageTitle = By.xpath("//*[text() = 'You have been logged out']")

export const loginPageTitle = By.xpath("//*[text() = 'Login']")
export const userButton = By.xpath("//*[text() = 'User - Mock']")
export const systemButton = By.xpath("//*[text() = 'System']")

export const homePageTitle = By.xpath("//*[text() = 'I would like to...']")
export const createPrescriptionsLink = By.linkText("Create Prescription(s)")
export const searchPrescriptionsLink = By.linkText("Check Prescription(s) status")

export const loadPageTitle = By.xpath("//*[text() = 'Load prescription(s)']")
export const viewButton = By.xpath("//*[text() = 'View']")

export const sendPageTitle = By.xpath("//*[text() = 'Prescription Summary']")
export const sendButton = By.xpath("//*[text() = 'Sign & Send']")

export const cancelPrescriptionPageTitle = By.xpath("//*[text() = 'Cancel Prescription']")
export const cancelButton = By.xpath("//*[text() = 'Cancel']")

export const releasePageTitle = By.xpath("//*[text() = 'Release prescription(s)']")
export const releaseButton = By.xpath("//*[text() = 'Release']")

export const returnPageTitle = By.xpath("//*[text() = 'Return prescription']")
export const returnButton = By.xpath("//*[text() = 'Return']")

export const dispensePageTitle = By.xpath("//*[text() = 'Dispense Prescription']")
export const dispenseByFormRadio = By.xpath("//*[@id='dispenseType-1']")
export const dispenseWithBodyRadio = By.xpath("//*[@id='dispenseType-2']")
export const dispenseBodyField = By.xpath("//*[@id='customDispenseFhir']")
export const itemFullyDispensedStatus = By.xpath("//select/option[text() = 'Item fully dispensed']")
export const dispenseButton = By.xpath("//*[text() = 'Dispense']")

export const dispenseExpanderAction = By.className("nhsuk-details nhsuk-expander")
export const amendDispensePageTitle = By.xpath("//*[text()[contains(.,'Amending Dispense:')]]")
export const itemAmendNotDispensedStatus = By.xpath("//select/option[text() = 'Item not dispensed']")
export const prescriptionNotDispensedStatus = By.xpath("//*[text() = 'Not Dispensed']")

export const withdrawPageTitle = By.xpath("//*[text()[contains(.,'Withdrawing Dispense:')]]")
export const withdrawButton = By.xpath("//*[text() = 'Withdraw']")

export const claimPageTitle = By.xpath("//*[text() = 'Claim for Dispensed Prescription']")
export const claimFormAddEndorsement = By.xpath('//button[text()="Add Endorsement"]')
export const brokenBulkEndorsement = By.xpath("//select/option[text() = 'Broken Bulk']")
export const claimButton = By.xpath("//*[text() = 'Claim']")

export const searchPageTitle = By.xpath("//*[text() = 'Search for a Prescription']")
export const searchButton = By.xpath("//*[text() = 'Search']")
export const searchResultsPageTitle = By.xpath("//*[text() = 'Search Results']")
export const searchViewDetailsButton = By.linkText("View Details")
export const searchDetailsPageTitle = By.xpath("//*[text() = 'Prescription Details']")

export const doseToTextTitle = By.xpath("//*[text() = 'Dose to Text']")
export const doseToTextLink = By.linkText("Convert dose to text")

export const myPrescriptionsPageTitle = myPrescriptionsNavLink
export const checkFirstReleasedPrescriptionStatusButton = By.xpath("/html/body/div/main/div/div/div/div[2]/table/tbody/tr/td[2]/div[3]")

export const prescriptionDetailsPageTitle = By.xpath("//*[text() = 'Prescription Details']")
export const prescriptionLineItemSummaryTableBody = By.xpath("/html/body/div/main/div/div/div/div[1]/table/tbody")
export const prescriptionLineItemIds = By.xpath("/html/body/div/main/div/div/div/div[1]/table/tbody/tr/td[1]")

export const pharmacyRadios = By.name("pharmacy")

// TODO: AEA-2524 - rename 'View prescription' page
export const viewPrescriptionAction = By.linkText("Check prescription status")
export const cancelPrescriptionAction = By.linkText("Cancel prescription")
export const releasePrescriptionAction = By.linkText("Release prescription")
export const dispensePrescriptionAction = By.linkText("Dispense prescription")
export const withdrawPrescriptionAction = By.linkText("Withdraw prescription")
export const AmendDispenseAction = By.linkText("Amend")
export const successTickIcon = By.className("nhsuk-icon__tick")
export const fhirRequestExpander = By.xpath("//*[contains(text(), 'FHIR Request that a supplier would send to the FHIR API')]")
export const hl7v3RequestExpander = By.xpath("//*[contains(text(), 'Equivalent hl7v3 that the FHIR API has sent to spine')]")
export const hl7v3ResponseExpander = By.xpath("//*[contains(text(), 'The hl7v3 spine response that the FHIR API received from spine')]")
export const fhirResponseExpander = By.xpath("//*[contains(text(), 'FHIR Response that a supplier will receive from the FHIR API')]")
export const copyFhirRequestButton = By.xpath("//*[text() = 'Copy']")
