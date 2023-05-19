import {getToken} from "../services/getaccessToken"
import instance from "../src/configs/api"
import * as helper from "../util/helper"

export let _number
export let _site
export let resp

let identifierValue

export const givenIAmAuthenticated = given => {
  given("I am authenticated", async() => {
    const token = await getToken(process.env.userId)
    console.log(token)
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`
  })
}

export const givenICreateXPrescriptionsForSite = given => {
  given(/^I create (.*) prescription\(s\) for (.*)$/, async (number, site) => {
    _number = number
    _site = site
    await helper.createPrescription(number, site)
  })
}

export const givenICreateXRepeatPrescriptionsForSite = given => {
  given(/^I create (.*) prescription\(s\) for (.*)$/, async (number, site, table) => {
    _number = number
    _site = site
    await helper.createPrescription(number, site, undefined, table)
  })
}

export const givenICreateXPrescriptionsForSiteWithDetails = given => {
  given(/^I create (.*) prescription\(s\) for (.*) with details$/, async (number, site, table) => {
    _number = number
    _site = site
    resp = await helper.createPrescription(number, site, 1, table)
  })
}
export const whenIPrepareXPrescriptionsForSiteWithDetails = when => {
  when(/^I prepare (.*) prescription\(s\) for (.*) with details$/, async (number, site, table) => {
    resp = await helper.preparePrescription(number, site, 1, table)
  })
}

export const whenIReleaseThePrescription = when => {
  when("I release the prescriptions", async () => {
    resp = await helper.releasePrescription(_number, _site)
    if (_number === 1 && resp.status === 200) {
      identifierValue = resp.data.parameter[0].resource.identifier.value
    }
  })
}
export const givenICreateXPrescriptionsForSiteWithAnInvalidSignature = given => {
  given(/^I create (\d+) prescription\(s\) for (.*) with an invalid signature$/, async (number, site) => {
    await helper.createPrescription(number, site, undefined, undefined, false)
    _number = number
    _site = site
  })
}
export const givenICreateXPrescriptionsForSiteWithXLineItems = given => {
  given(/^I create (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
    await helper.createPrescription(number, site, medReqNo)
    _number = number
    _site = site
  })
}

export const givenIPrepareXPrescriptionsForSiteWithXLineItems = given => {
  given(/^I prepare (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
    resp = await helper.preparePrescription(number, site, medReqNo)
  })
}

export const thenIGetASuccessResponse = then => {
  then(/^I get a success response (\d+)$/, status => {
    expect(resp.status).toBe(parseInt(status))
  })
}
export const thenIGetAnErrorResponse = then => {
  then(/^I get an error response (\d+)$/, (status, table) => {
    expect(resp.status).toBe(parseInt(status))
    if (table[0].errorObject === "issue") {
      expect(resp.data.issue[0].details.coding[0].display).toMatch(table[0].message)
    } else if (table[0].errorObject === "entry") {
      expect(resp.data.entry[1].resource.extension[0].extension[0].valueCoding.display).toMatch(table[0].message)
    }
  })
}
export const whenIAmendTheDispenseClaim = when => {
  when(/^I amend the dispense claim$/, async table => {
    resp = await helper.amendDispenseClaim(table)
  })
}
export const whenISendADispenseClaim = (when, hasTable = false) => {
  when("I send a dispense claim", async table => {
    if (hasTable) {
      resp = await helper.sendDispenseClaim(_site, 1, table)
    } else {
      resp = await helper.sendDispenseClaim(_site)
    }
  })
}
export const whenISendADispenseClaimForTheNolineItems = when => {
  when(/^I send a dispense claim for the (\d+) line items$/, async (claimNo, table) => {
    resp = await helper.sendDispenseClaim(_site, claimNo, table)
  })
}
export const whenISendADispenseNotification = when => {
  when("I send a dispense notification", async table => {
    resp = await helper.sendDispenseNotification(_site, 1, table)
  })
}

export const whenISendADispenseNotificationForTheNolineItems = when => {
  when(/^I send a dispense notification for the (\d+) line items$/, async (medDispNo, table) => {
    resp = await helper.sendDispenseNotification(_site, medDispNo, table)
  })
}

export const thePrescriptionIsMarkedAs = then => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  then(/^the prescription is marked as (.*)$/, status => {
    //TODO
  })
}

export const whenIReturnThePrescription = when => {
  when("I return the prescription", async table => {
    resp = await helper.returnPrescription(_site, identifierValue, table)
  })
}

export const thenIGetPrescriptionsReleasedToSite = then => {
  then(/^I get prescription\(s\) released$/, table => {
    const passedPrescriptionResourceEntry = resp.data.parameter[0].resource.entry[0].resource
    expect(passedPrescriptionResourceEntry.entry[0].resource.destination[0].receiver.identifier.value)
      .toBe(table[0].site)
    expect(passedPrescriptionResourceEntry.entry[1].resource.resourceType).toBe("MedicationRequest")
    expect(passedPrescriptionResourceEntry.entry[1].resource.medicationCodeableConcept.coding[0].display)
      .toBe(table[0].medicationDisplay)
    expect(passedPrescriptionResourceEntry.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
    expect(passedPrescriptionResourceEntry.entry[2].resource.resourceType).toBe("Patient")
    expect(passedPrescriptionResourceEntry.entry[2].resource.identifier[0].value).toBe("9449304130")

  })
}
export const andICancelThePrescription = and => {
  and("I cancel the prescription", async table => {
    resp = await helper.cancelPrescription(table)
  })
}
export const theIGetPrescriptionReleased = then => {
  then(/^I get (.*) prescription\(s\) released to (.*)$/, (number, site) => {
    expect(resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value)
      .toBe(site)
  })
}

export const thePrescriptionIsMarkedAsDispensed = then => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  then(/^the prescription is marked as (.*) dispensed$/, status => {
    //TODO
  })
}

export const thePrescriptionStatusIsWithDispenser = and => {
  and("the prescription status is With Dispenser", async () => {
    //TODO
  })
}
