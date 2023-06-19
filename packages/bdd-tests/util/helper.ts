import * as crypto from "crypto"
import * as misc from "../testData/miscJSON"
import {Req} from "../src/configs/spec"
import {
  getClaimTemplate,
  getCommunicationRequestTemplate,
  getDispenseTemplate,
  getMedClaimTemplate,
  getMedDispenseTemplate,
  getMedRequestTemplate,
  getPrepareTemplate,
  getProvenanceTemplate,
  getReleaseTemplate,
  getReturnTemplate,
  getWithdrawDispenseNTemplate
} from "./templates"
import instance from "../src/configs/api"
import * as jwt from "../services/getJWT"
import {DataTable} from "@cucumber/cucumber"

import * as genid from "./genId"

const refIdList = []
let addRefId = false
const digests = new Map()
const bodyDataWithPrescriptionKey = new Map()
const authoredOn = new Date().toISOString()

export async function preparePrescription(number, site, medReqNo = 1, table: DataTable = null, ctx) {
  const authoredOn = new Date().toISOString()
  let position = 2
  let resp = null
  ctx.data = []
  ctx.shortPrescId = []
  ctx.longPrescId = []
  ctx.prepareResponse = []

  for (let i = 0; i < number; i++) {
    const shortPrescId = genid.shortPrescId()
    const longPrescId = crypto.randomUUID()
    console.log(ctx.shortPrescId)
    const data = getPrepareTemplate()

    if (medReqNo > 1) {
      for (const medReq of addItemReq(medReqNo, "medicationRequest")) {
        data.entry.splice(position, 0, medReq)
        refIdList.push(medReq.fullUrl)
        position += 1
      }
      addRefId = true
    }
    setBundleIdAndValue(data, "others", ctx)

    if (table !== null && Object.prototype.hasOwnProperty.call(table.hashes()[0], "addResource")) {
      addResource(table, data)
    }

    for (const entry of data.entry) {
      if (entry.resource.resourceType === "MedicationRequest") {
        if (table !== null) {
          if (Object.prototype.hasOwnProperty.call(table.hashes()[0], "removeBlock")) {
            removeJsonBlock(table, entry)
          } else if (Object.prototype.hasOwnProperty.call(table.hashes()[0], "snomedId")) {
            entry.resource.medicationCodeableConcept.coding[0].code = table.hashes()[0].snomedId
            entry.resource.medicationCodeableConcept.coding[0].display = table.hashes()[0].medItem
            entry.resource.dispenseRequest.quantity.value = table.hashes()[0].quantity
            entry.resource.dosageInstruction[0].text = table.hashes()[0].dosageInstructions
          }
        }

        entry.resource.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
        entry.resource.groupIdentifier.value = shortPrescId
        entry.resource.authoredOn = authoredOn
        entry.resource.dispenseRequest.performer.identifier.value = site

        if (
          table !== null &&
          Object.prototype.hasOwnProperty.call(table.hashes()[0], "prescriptionType") &&
          table.hashes()[0].prescriptionType !== "acute"
        ) {
          //logic to add make prescription a repeat/erd.
          setRepeatOrERDAttributes(entry, table)
        }
      }
      updateMessageHeader(entry, addRefId, refIdList, site)
    }

    await Req()
      .post("/FHIR/R4/$prepare", data)
      .then((_data) => {
        resp = _data
      })
      .then(() => {
        ctx.data.push(data)
        ctx.shortPrescId.push(shortPrescId)
        ctx.longPrescId.push(longPrescId)
        ctx.prepareResponse.push(resp)
      })
      .catch((error) => {
        resp = error.response
        throw error
      })
  }
}

export async function createPrescription(number, site, medReqNo = 1, table: DataTable = null, valid = true, ctx) {
  ctx.createResponse = []
  await preparePrescription(number, site, medReqNo, table, ctx)
  for (let i = 0; i < number; i++) {
    const prepareResponse = ctx.resp[i]
    const data = ctx.data[i]
    const shortPrescId = ctx.shortPrescId[i]
    const digest = prepareResponse.data.parameter[0].valueString
    const timestamp = prepareResponse.data.parameter[1].valueString
    digests.set(ctx.shortPrescId, [digest, timestamp])
    bodyDataWithPrescriptionKey.set(shortPrescId, JSON.stringify(data))
    const signatures = jwt.getSignedSignature(digests, valid)
    for (const [key, value] of bodyDataWithPrescriptionKey.entries()) {
      const prov = getProvenanceTemplate()
      const uid = crypto.randomUUID()
      prov.resource.id = uid
      prov.fullUrl = "urn:uuid:" + uid
      prov.resource.recorded = new Date().toISOString()
      prov.resource.signature[0].data = signatures.get(key)
      prov.resource.signature[0].when = digests.get(key)[1]
      const bodyData = JSON.parse(value)
      bodyData.entry.push(prov)

      setNewRequestIdHeader()
      await Req()
        .post("/FHIR/R4/$process-message#prescription-order", bodyData)
        .then((_data) => {
          ctx.createResponse.push(_data)
        })
        .catch((error) => {
          ctx.createResponse.push(error.response)
        })
    }
  }
}

export async function releasePrescription(number, site, ctx) {
  const _number = parseInt(number)
  const data = getReleaseTemplate()
  data.id = crypto.randomUUID()
  if (_number > 1) {
    data.parameter.pop()
  }
  for (const param of data.parameter) {
    if (_number === 1 && param.name === "group-identifier") {
      param.valueIdentifier.value = ctx.shortPrescId
    }
    if (param.name === "owner") {
      param.resource.identifier[0].value = site
    }
  }
  setNewRequestIdHeader()
  await Req()
    .post("/FHIR/R4/Task/$release", data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

export async function cancelPrescription(table: DataTable, ctx) {
  for (const value of bodyDataWithPrescriptionKey.values()) {
    const data = JSON.parse(value)
    data.identifier.value = crypto.randomUUID()
    for (const entry of data.entry) {
      const ext = misc.extReplacementOf
      ext.extension[1].valueIdentifier.value = ctx.identifierValue
      for (const entry of data.entry) {
        if (entry.resource.resourceType === "MessageHeader") {
          entry["resource"]["extension"] = [ext.extension[1]]
          entry.resource.eventCoding.code = "prescription-order-update"
          entry.resource.eventCoding.display = "Prescription Order Update"
        }
      }
      if (entry.resource.resourceType === "MedicationRequest") {
        const statusReason = misc.statusReason
        statusReason.coding[0].system = "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason"
        statusReason.coding[0].code = table.hashes()[0].statusReasonCode
        statusReason.coding[0].display = table.hashes()[0].statusReasonDisplay
        entry["resource"]["statusReason"] = statusReason
        entry.resource.status = "cancelled"
      }
    }

    await Req()
      .post("/FHIR/R4/$process-message#prescription-order-update", data)
      .then((_data) => {
        ctx.resp = _data
      })
      .catch((error) => {
        ctx.resp = error.response
      })
  }
  return ctx.resp
}

export async function returnPrescription(site, identifierValue, table: DataTable, ctx) {
  const data = getReturnTemplate()
  for (const contained of data.contained) {
    if (contained.resourceType === "Organization") {
      contained.identifier[0].value = site
    }
  }
  data.id = crypto.randomUUID()
  data.groupIdentifier.value = ctx.shortPrescId
  data.identifier[0].value = crypto.randomUUID()
  data.focus.identifier.value = identifierValue
  data.authoredOn = new Date().toISOString()
  data.statusReason.coding[0].code = table.hashes()[0].statusReasonCode
  data.statusReason.coding[0].display = table.hashes()[0].statusReasonDisplay
  await Req()
    .post("/FHIR/R4/Task#return", data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

export async function sendDispenseNotification(site, medDispNo = 1, table: DataTable, ctx) {
  const refIdList = []
  let addRefId = false
  let position = 2
  ctx.data = getDispenseTemplate()
  if (medDispNo > 1) {
    for (const medDisp of addItemReq(medDispNo, "dispenseRequest")) {
      ctx.data.entry.splice(position, 0, medDisp)
      refIdList.push(medDisp.fullUrl)
      position += 1
    }
    addRefId = true
  }
  setBundleIdAndValue(ctx.data, "others", ctx)
  let i = 0
  for (const entry of ctx.data.entry) {
    if (entry.resource.resourceType === "MedicationDispense") {
      for (const contained of entry.resource.contained) {
        if (contained.resourceType === "MedicationRequest") {
          contained.groupIdentifier.extension[0].valueIdentifier.value = ctx.longPrescId
          contained.groupIdentifier.value = ctx.shortPrescId
          contained.authoredOn = new Date().toISOString()
          contained.dispenseRequest.performer.identifier.value = site
        }
      }
      entry.resource.type.coding[0].code = table.hashes()[i].code
      entry.resource.type.coding[0].display = table.hashes()[i].dispenseType
      if (Object.prototype.hasOwnProperty.call(table.hashes()[0], "notifyCode")) {
        // notifycode is only set when there is a combination
        // of codes, and we use this value to decide the status. If not passed, then status  is worked out from the code provided
        setExtension(table.hashes()[i].notifyCode, entry, table.hashes()[i].quantity)
      } else {
        setExtension(table.hashes()[i].code, entry, table.hashes()[i].quantity)
      }
      i += 1
    }
    updateMessageHeader(entry, addRefId, refIdList, site)

    if (entry.resource.resourceType === "Organization") {
      entry.resource.identifier[0].value = site
    }
  }

  setNewRequestIdHeader()
  await Req()
    .post("/FHIR/R4/$process-message#dispense-notification", ctx.data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

export async function amendDispenseNotification(itemNo, table: DataTable, ctx) {
  ctx.data.id = crypto.randomUUID()
  ctx.data.identifier.value = crypto.randomUUID()
  const ext = misc.extReplacementOf
  console.log("our test + " + ext.extension[0].valueIdentifier.value)
  for (const entry of ctx.data.entry) {
    if (entry.resource.resourceType === "MessageHeader") {
      entry["resource"]["extension"] = [ext.extension[0]]
    }
  }
  //d = {...d.entry[0].resource, extension: e.extension} - another way to add object. prefer to keep this
  ctx.data.entry[itemNo].resource.type.coding[0].code = table.hashes()[0].code
  ctx.data.entry[itemNo].resource.type.coding[0].display = table.hashes()[0].dispenseType
  await Req()
    .post("/FHIR/R4/$process-message#dispense-notification", ctx.data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

export async function withdrawDispenseNotification(site, table: DataTable, ctx) {
  const data = getWithdrawDispenseNTemplate()
  for (const contained of data.contained) {
    if (contained.resourceType === "Organization") {
      contained.identifier[0].value = site
    }
  }
  data.id = crypto.randomUUID()
  data.groupIdentifier.value = ctx.shortPrescId
  data.identifier[0].value = crypto.randomUUID()
  data.focus.identifier.value = ctx.identifierValue
  data.authoredOn = new Date().toISOString()
  data.owner.identifier.value = site
  data.statusReason.coding[0].code = table.hashes()[0].statusReasonCode
  data.statusReason.coding[0].display = table.hashes()[0].statusReasonDisplay
  await Req()
    .post("/FHIR/R4/Task#withdraw", data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

export async function sendDispenseClaim(site, claimNo = 1, table: DataTable = null, ctx) {
  let position = 2
  ctx.data = getClaimTemplate()
  if (claimNo > 1) {
    for (const item of addItemReq(claimNo, "claimItem")) {
      ctx.data.item[0].detail.splice(position, 0, item)
      position += 1
    }
  }
  if (table !== null && Object.prototype.hasOwnProperty.call(table.hashes()[0], "createdDate")) {
    ctx.data.created = table.hashes()[0].createdDate
  } else {
    ctx.data.created = authoredOn
  }
  setBundleIdAndValue(ctx.data, "claim", ctx)
  ctx.data.prescription.extension[0].extension[1].valueIdentifier.value = ctx.longPrescId
  ctx.data.prescription.extension[0].extension[0].valueIdentifier.value = ctx.shortPrescId

  if (table !== null && !Object.prototype.hasOwnProperty.call(table.hashes()[0], "createdDate")) {
    ctx.data.insurance[0].coverage.identifier.value = table.hashes()[0].odsCode
    ctx.data.item[0].programCode[1].coding[0].code = table.hashes()[0].evidenceSeen
    ctx.data.item[0].programCode[1].coding[0].display = table.hashes()[0].evidenceSeen.replaceAll("-", " ")
    const endorsementCodeList = table.hashes()[0].endorsementCode.split(",")
    const prescriptionChargeList = table.hashes()[0].prescriptionCharge.split(",")
    for (let i = 0; i < claimNo; i++) {
      ctx.data.item[0].detail[i].programCode[0].coding[0].code = prescriptionChargeList[i]
      ctx.data.item[0].detail[i].programCode[0].coding[0].display = prescriptionChargeList[i].replaceAll("-", " ")
      ctx.data.item[0].detail[i].programCode[1].coding[0].code = endorsementCodeList[i]
      ctx.data.item[0].detail[i].programCode[1].coding[0].display = endorsementCodeMap.get(endorsementCodeList[i])
    }
  }

  for (const contained of ctx.data.contained) {
    if (contained.resourceType === "Organization") {
      contained.identifier[0].value = site
    }
  }

  await Req()
    .post("/FHIR/R4/Claim", ctx.data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

export async function amendDispenseClaim(table: DataTable, ctx) {
  ctx.data.id = crypto.randomUUID()
  ctx.data.identifier[0].value = crypto.randomUUID()
  const ext = misc.extReplacementOf
  ext.extension[0].valueIdentifier.value = ctx.identifierValue
  ctx.data.extension.push(ext.extension[0])
  ctx.data.item[0].programCode[1].coding[0].code = table.hashes()[0].evidenceSeen
  ctx.data.item[0].programCode[1].coding[0].display = table.hashes()[0].evidenceSeen.replaceAll("-", " ")

  await Req()
    .post("/FHIR/R4/Claim", ctx.data)
    .then((_data) => {
      ctx.resp = _data
    })
    .catch((error) => {
      ctx.resp = error.response
    })
  return ctx.resp
}

const endorsementCodeMap = new Map()
endorsementCodeMap.set("NDEC", "No Dispenser Endorsement Code")
endorsementCodeMap.set("BB", "Broken Bulk")

function setBundleIdAndValue(data, resourceType = "others", ctx) {
  ctx.identifierValue = crypto.randomUUID()
  data.id = crypto.randomUUID()
  if (resourceType === "claim") {
    data.identifier[0].value = ctx.identifierValue
  } else {
    data.identifier.value = ctx.identifierValue
  }
}

function setNewRequestIdHeader() {
  instance.interceptors.request.use((config) => {
    config.headers["X-Request-ID"] = crypto.randomUUID()
    return config
  })
}

function updateMessageHeader(entry, addRefId, refIdList, site) {
  if (entry.resource.resourceType === "MessageHeader") {
    entry.fullUrl = "urn:uuid:" + crypto.randomUUID()
    entry.resource.destination[0].receiver.identifier.value = site
    if (addRefId) {
      for (const ref of refIdList) {
        entry.resource.focus.push({reference: ref})
      }
    }
  }
}

function setExtension(code, entry, quantity) {
  switch (code) {
    case "0001":
      entry.resource.extension[0].valueCoding.code = "0006"
      entry.resource.extension[0].valueCoding.display = "Dispensed"
      break
    case "0002":
      entry.resource.extension[0].valueCoding.code = "0007"
      entry.resource.extension[0].valueCoding.display = "Not Dispensed"
      entry["resource"][misc.statusReasonkey] = misc.statusReason
      break
    case "0003":
      entry.resource.extension[0].valueCoding.code = "0003"
      entry.resource.extension[0].valueCoding.display = "With Dispenser - Active"
      entry.resource.quantity.value = quantity
      break
    case "0004":
      entry.resource.extension[0].valueCoding.code = "0003"
      entry.resource.extension[0].valueCoding.display = "With Dispenser - Active"
      break
    case "0005":
      entry.resource.extension[0].valueCoding.code = "0002"
      entry.resource.extension[0].valueCoding.display = "With Dispenser"
      break
    case "0006":
      entry.resource.extension[0].valueCoding.code = "0002"
      entry.resource.extension[0].valueCoding.display = "With Dispenser"
      break
  }
}

function removeJsonBlock(table: DataTable, entry) {
  switch (table.hashes()[0].removeBlock) {
    case "dosageInstructions":
      delete entry["resource"]["dosageInstruction"]
      break
    case "dm+d":
      delete entry["resource"]["medicationCodeableConcept"]
      break
    case "quantity":
      delete entry["resource"]["dispenseRequest"]["quantity"]
      break
    default:
      console.error(`${table.hashes()[0].removeBlock} undefined`)
  }
}

export function addItemReq(number, itemType) {
  if (parseInt(number) > 5) {
    console.error("ERROR!!!!!!!!!!!, See below message")
    throw new Error(`Currently supporting a maximum of 5 ${itemType}s items, please adjust your request to 5 or less`)
  }
  const dataArray = []
  let data = getMedRequestTemplate()
  switch (itemType) {
    case "medicationRequest":
      data = getMedRequestTemplate()
      break
    case "dispenseRequest":
      data = getMedDispenseTemplate()
      break
    case "claimItem":
      data = getMedClaimTemplate()
      break
    default:
      console.error(`${itemType} undefined`)
  }
  for (let i = 0; i < number - 1; i++) {
    //As we adding one default item in the Request,
    // we need to remove 1 from the number passed in the feature file
    dataArray.push(data.medication[i])
  }
  return dataArray
}

function addResource(table: DataTable, data) {
  switch (table.hashes()[0].addResource) {
    case "communicationRequest": {
      addRefId = true
      const commData = getCommunicationRequestTemplate()
      refIdList.push(commData.fullUrl)
      commData.resource.payload[0].contentString = table.hashes()[0].additionalInstructions
      data.entry.push(commData)
      break
    }
    case "MedReqNotes":
      for (const entry of data.entry) {
        if (entry.resource.resourceType === "MedicationRequest") {
          entry["resource"]["note"] = [{text: table.hashes()[0].additionalInstructions}]
        }
      }
      break
    case "addEndorsement":
      misc.endorsement.valueCodeableConcept.coding[0].code = table.hashes()[0].addEndorsementCode
      misc.endorsement.valueCodeableConcept.coding[0].display = table.hashes()[0].addEndorsementDisplay
      for (const entry of data.entry) {
        if (entry.resource.resourceType === "MedicationRequest") {
          entry.resource.extension.push(misc.endorsement)
        }
      }
      break
    default:
      console.error(`${table.hashes()[0].addResource} undefined`)
  }
}

function setRepeatOrERDAttributes(entry, table: DataTable) {
  const medRepInfo = misc.medicationRepeatInfo
  if (table.hashes()[0].prescriptionType === "repeat") {
    entry.resource.extension.push(medRepInfo)
    entry.resource.intent = "instance-order"
    entry["resource"]["basedOn"] = misc.basedon.basedOn
    entry.resource.courseOfTherapyType.coding[0].code = "continuous"
    entry.resource.courseOfTherapyType.coding[0].display = "Continuous long term therapy"
    entry["resource"]["dispenseRequest"]["numberOfRepeatsAllowed"] = 0
  } else if (table.hashes()[0].prescriptionType === "erd") {
    medRepInfo.extension.splice(0, 1)
    entry.resource.extension.push(medRepInfo)
    entry.resource.intent = "original-order"
    entry.resource.courseOfTherapyType.coding[0].system = "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy"
    entry.resource.courseOfTherapyType.coding[0].code = "continuous-repeat-dispensing"
    entry.resource.courseOfTherapyType.coding[0].display = "Continuous long term (repeat dispensing)"
    entry["resource"]["dispenseRequest"]["numberOfRepeatsAllowed"] = table.hashes()[0].numberOfRepeatsAllowed
  }
}
