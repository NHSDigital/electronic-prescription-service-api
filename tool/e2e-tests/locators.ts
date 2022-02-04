import {By} from "selenium-webdriver"

export const loginPageTitle = By.xpath("//*[text() = 'Login']")
export const userButton = By.xpath("//*[text() = 'User']")
export const systemButton = By.xpath("//*[text() = 'System']")

export const homePageTitle = By.xpath("//*[text() = 'I would like to...']")
export const createPrescriptionsLink = By.linkText("Create Prescription(s)")

export const loadPageTitle = By.xpath("//*[text() = 'Load prescription(s)']")

export const releasePageTitle = By.xpath("//*[text() = 'Release prescription(s)']")
export const releaseButton = By.xpath("//*[text() = 'Release']")

export const dispensePageTitle = By.xpath("//*[text() = 'Dispense Prescription']")
export const itemFullyDispensedStatus = By.xpath("//select/option[text() = 'Item fully dispensed']")
export const dispenseButton = By.xpath("//*[text() = 'Dispense']")

export const myPrescriptionsPageTitle = By.xpath("//*[text() = 'My Prescriptions']")
export const myPrescriptionsNavLink = myPrescriptionsPageTitle

export const pharmacyRadios = By.name("pharmacy")

export const releasePrescriptionAction = By.linkText("Release prescription")
export const dispensePrescriptionAction = By.linkText("Dispense prescription")
