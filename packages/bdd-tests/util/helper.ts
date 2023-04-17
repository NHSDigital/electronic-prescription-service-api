import * as crypto from "crypto"
import * as misc from '../testData/misc_json'
import {Req}  from '../src/configs/spec'
import {
  get_ClaimTemplate,
  get_communicationRequestTemplate,
  get_DispenseTemplate, get_medClaimTemplate, get_medDispenseTemplate,
  get_medRequestTemplate, get_PrepareTemplate,
  get_ProvenanceTemplate,
  get_ReleaseTemplate
} from "./templates"
import instance from "../src/configs/api"
import * as jwt from "../services/getJWT"

import * as genid from "./genId"


export let shortPrescId = ""
export let longPrescId = ""
let identifierValue = ""
let data = null;
let resp = null
const refIdList = []
let addRefId = false
const digests = new Map();
const authoredOn = new Date().toISOString()
export async function preparePrescription(number, site, medReqNo = 1, table = null){
  const body = new Map()
  const authoredOn = new Date().toISOString()
  let position = 2

  for (let i = 0; i < number; i++) {
    shortPrescId = genid.shortPrescId()
    longPrescId = crypto.randomUUID()
    console.log(shortPrescId)
    data = get_PrepareTemplate()

    if (medReqNo > 1) {

      for (const medReq of addItemReq(medReqNo, "medicationRequest")) {
        //data.entry.push(medReq)
        data.entry.splice(position, 0, (medReq))
        refIdList.push(medReq.fullUrl)
        position += 1
      }
      addRefId = true
    }
    setBundleIdAndValue(data)

    if (table != null && table[0].hasOwnProperty("addResource")) {
      addResource(table)
    }

    for (const entry of data.entry) {
      if (entry.resource.resourceType == "MedicationRequest") {
        if (table != null ) {
          if (table[0].hasOwnProperty("removeBlock")) {
            removeJsonBlock(table, entry)
          } else if (table[0].hasOwnProperty("snomedId")) {
            entry.resource.medicationCodeableConcept.coding[0].code = table[0].snomedId
            entry.resource.medicationCodeableConcept.coding[0].display = table[0].medItem
            entry.resource.dispenseRequest.quantity.value = table[0].quantity
            entry.resource.dosageInstruction[0].text = table[0].dosageInstructions
          }
        }

        entry.resource.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
        entry.resource.groupIdentifier.value = shortPrescId
        entry.resource.authoredOn = authoredOn
        entry.resource.dispenseRequest.performer.identifier.value = site

        if (table != null && table[0].hasOwnProperty("prescriptionType") && table[0].prescriptionType != "acute"){  //logic to add make prescription a repeat/erd.
          setRepeatOrERDAttributes(entry, table)
        }
      }
      updateMessageHeader(entry, addRefId, refIdList, site)
    }

    //console.log(JSON.stringify(data))


    await Req().post(`${process.env.eps_path}/FHIR/R4/$prepare`, data)
      .then(_data => { resp = _data })
      .catch(error => { resp = error.response; });

    if (resp.status == 200) {
      digests.set(shortPrescId, resp.data.parameter[0].valueString)
      body.set(shortPrescId, JSON.stringify(data)) // can't iterate over object in map, so converting to json string
    }
  }
  return [resp, body]
}
export async function createPrescription(number, site, medReqNo = 1, table = null, valid= true){
  let body = await preparePrescription(number, site, medReqNo, table)
  let signatures = jwt.getSignedSignature(digests, valid)
  for (let [key, value] of body[1].entries()) {
    let prov = get_ProvenanceTemplate()
    let uid = crypto.randomUUID();
    prov.resource.id = uid;
    prov.fullUrl = "urn:uuid:" + uid;
    prov.resource.recorded = new Date().toISOString();
    prov.resource.signature[0].data = signatures.get(key);
    prov.resource.signature[0].when = new Date().toISOString();
    let bodyData = JSON.parse(value)
    bodyData.entry.push(prov);
    //console.log("Nnnnnnnnnnnnnnnnnnnnnnnnmf------------- " + JSON.stringify(bodyData))
    //body.get(key).entry.push

    setNewRequestIdHeader()
    await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#prescription-order`, bodyData)
      .then(_data => { resp = _data })
      .catch(error => { resp = error.response; });
    return resp
  }
}

export async function releasePrescription(number, site){
  let data = get_ReleaseTemplate()
  //console.log(data)
  if (number > 1) {
    data.parameter.pop()
    //console.log(data)
  } if (number == 1) {
    for (const param of data.parameter) {
      if (param.name == "group-identifier") {
        param.valueIdentifier.value = shortPrescId;
      }
      if (param.name == "owner") {
        param.resource.identifier.value = site
      }
    }
  }
  setNewRequestIdHeader()
  await Req().post(`${process.env.eps_path}/FHIR/R4/Task/$release`, data)
    .then(_data => { resp = _data })
    .catch(error => { resp = error.response; });
  return resp
}

export async function sendDispenseNotification(site, medDispNo = 1, table){
  const refIdList = []
  let addRefId = false
  //const authoredOn = new Date().toISOString()
  let position = 2
  data = get_DispenseTemplate()
  if (medDispNo > 1) {

    for (const medDisp of addItemReq(medDispNo, "dispenseRequest")){
      //data.entry.push(medReq)
      data.entry.splice(position, 0, (medDisp))
      refIdList.push(medDisp.fullUrl)
      position += 1
    }
    addRefId = true
  }
  setBundleIdAndValue(data)
  let i = 0
  for (const entry of data.entry) {
    if (entry.resource.resourceType == "MedicationDispense" ) {
      for (const contained of entry.resource.contained) {
        if (contained.resourceType == "MedicationRequest") {
          contained.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
          contained.groupIdentifier.value = shortPrescId
          contained.authoredOn = new Date().toISOString()
          contained.dispenseRequest.performer.identifier.value = site
        }
      }
      entry.resource.type.coding[0].code = table[i].code
      entry.resource.type.coding[0].display = table[i].dispenseType
      if (table[0].hasOwnProperty("notifyCode")){ // notifycode is only set when there is a combination of codes, and we use this value to decide the status. If not passed, then status  is worked out from the code provided
        setExtension(table[i].notifyCode, entry, table[i].quantity)
      } else {
        setExtension(table[i].code, entry, table[i].quantity)
      }
      i += 1
    }
    updateMessageHeader(entry, addRefId, refIdList, site)

    if (entry.resource.resourceType == "Organization") {
      entry.resource.identifier[0].value = site
    }
  }

  setNewRequestIdHeader()
  await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#dispense-notification`, data)
    .then(_data => { resp = _data })
    .catch(error => { resp = error.response; });
  return resp
}

export async function amendDispenseNotification(itemNo, table){
  data.id = crypto.randomUUID();
  data.identifier.value = crypto.randomUUID();
  let ext = misc.extReplacementOf
  ext.extension[0].valueIdentifier.value = identifierValue
  for (const entry of data.entry) {
    if (entry.resource.resourceType == "MessageHeader") {
      entry["resource"]["extension"] = ext.extension
    }
  }
  //d = {...d.entry[0].resource, extension: e.extension}
  data.entry[itemNo].resource.type.coding[0].code = table[0].code
  data.entry[itemNo].resource.type.coding[0].display = table[0].dispenseType
  await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#dispense-notification`, data)
    .then(_data => { resp = _data })
    .catch(error => { resp = error.response; });
  return resp
}

export async function sendDispenseClaim(site, claimNo = 1, table = null){
  let position = 2
  data = get_ClaimTemplate()
  if (claimNo > 1) {

    for (const item of addItemReq(claimNo, "claimItem")){
      data.item[0].detail.splice(position, 0, (item))
      position += 1
    }
  }
  if (table != null && table[0].hasOwnProperty("createdDate")){
    data.created = table[0].createdDate
  } else {
    data.created = authoredOn
  }
  setBundleIdAndValue(data, "claim")
  data.prescription.extension[0].extension[1].valueIdentifier.value = longPrescId
  data.prescription.extension[0].extension[0].valueIdentifier.value = shortPrescId

  if (table != null && !table[0].hasOwnProperty("createdDate")){
    data.insurance[0].coverage.identifier.value = table[0].odsCode
    data.item[0].programCode[1].coding[0].code = table[0].evidenceSeen
    data.item[0].programCode[1].coding[0].display = table[0].evidenceSeen.replaceAll("-", " ")
    const endorsementCodeList = table[0].endorsementCode.split(",")
    const prescriptionChargeList = table[0].prescriptionCharge.split(",")
    for (let i = 0; i < claimNo; i++) {
      data.item[0].detail[i].programCode[0].coding[0].code = prescriptionChargeList[i]
      data.item[0].detail[i].programCode[0].coding[0].display = prescriptionChargeList[i].replaceAll("-", " ")
      data.item[0].detail[i].programCode[1].coding[0].code = endorsementCodeList[i]
      data.item[0].detail[i].programCode[1].coding[0].display = endorsementCodeMap.get(endorsementCodeList[i])
    }
  }

  for (const contained of data.contained) {
    if (contained.resourceType == "Organization") {
      contained.identifier[0].value = site
    }
  }

  await Req().post(`${process.env.eps_path}/FHIR/R4/Claim`, data)
    .then(_data => { resp = _data })
    .catch(error => { resp = error.response; });
  return resp
}

export async function amendDispenseClaim(table){
  data.id = crypto.randomUUID();
  data.identifier[0].value = crypto.randomUUID();
  let ext = misc.extReplacementOf
  ext.extension[0].valueIdentifier.value = identifierValue
  data.extension.push(ext.extension[0])
  data.item[0].programCode[1].coding[0].code = table[0].evidenceSeen
  data.item[0].programCode[1].coding[0].display = table[0].evidenceSeen.replaceAll("-", " ")

  await Req().post(`${process.env.eps_path}/FHIR/R4/Claim`, data)
    .then(_data => { resp = _data })
    .catch(error => { resp = error.response; });
  return resp
}

const endorsementCodeMap = new Map()
endorsementCodeMap.set("NDEC", "No Dispenser Endorsement Code")
endorsementCodeMap.set("BB", "Broken Bulk")

function setBundleIdAndValue(data, resourceType = "others"){
  identifierValue = crypto.randomUUID()
  data.id = crypto.randomUUID();
  if (resourceType == "claim") {
    data.identifier[0].value = identifierValue
  } else {
    data.identifier.value = identifierValue;
  }
}


function setNewRequestIdHeader(){
  instance.interceptors.request.use(config => {
    config.headers["X-Request-ID"] = crypto.randomUUID();
    return config;
  });
}

function updateMessageHeader(entry, addRefId, refIdList, site){
  if (entry.resource.resourceType == "MessageHeader") {
    entry.fullUrl = "urn:uuid:" + crypto.randomUUID();
    entry.resource.destination[0].receiver.identifier.value = site
    if (addRefId){
      for (const ref of refIdList){
        entry.resource.focus.push({"reference":ref})
      }
    }
  }
}

function setExtension(code, entry, quantity) {
  switch (code) {
    case '0001':
      entry.resource.extension[0].valueCoding.code = '0006';
      entry.resource.extension[0].valueCoding.display = 'Dispensed';
      break;
    case '0002':
      entry.resource.extension[0].valueCoding.code = '0007';
      entry.resource.extension[0].valueCoding.display = 'Not Dispensed';
      entry["resource"][misc.statusReasonkey] = misc.statusReason;
      break;
    case '0003':
      entry.resource.extension[0].valueCoding.code = '0003';
      entry.resource.extension[0].valueCoding.display = 'With Dispenser - Active';
      entry.resource.quantity.value = quantity
      break;
    case '0004':
      entry.resource.extension[0].valueCoding.code = '0003';
      entry.resource.extension[0].valueCoding.display = 'With Dispenser - Active';
      break;
    case '0005':
      entry.resource.extension[0].valueCoding.code = '0002';
      entry.resource.extension[0].valueCoding.display = 'With Dispenser';
      break;
    case '0006':
      entry.resource.extension[0].valueCoding.code = '0002';
      entry.resource.extension[0].valueCoding.display = 'With Dispenser';
      break;
  }
}

function removeJsonBlock(table, entry){
  switch (table[0].removeBlock) {
    case 'dosageInstructions':
      delete (entry["resource"]["dosageInstruction"])
      break;
    case 'dm+d':
      delete (entry["resource"]["medicationCodeableConcept"])
      break;
    case 'quantity':
      delete (entry["resource"]["dispenseRequest"]["quantity"])
      break;
    default:
      console.error(`${table[0].removeBlock} undefined`)
  }
}

export function addItemReq(number, itemType){
  if (number > 5) {
    console.error('ERROR!!!!!!!!!!!, See below message')
    throw new Error(`Currently supporting a maximum of 5 ${itemType}s items, please adjust your request to 5 or less`);
  }
  let dataArray = []
  let data = get_medRequestTemplate()
  switch (itemType) {
    case 'medicationRequest':
      data = get_medRequestTemplate()
      break;
    case 'dispenseRequest':
      data = get_medDispenseTemplate()
      break;
    case 'claimItem':
      data = get_medClaimTemplate()
      break;
    default:
      console.error(`${itemType} undefined`)
  }
  for (let i = 0; i < number - 1; i++) { //As we adding one default item in the Request, we need to remove 1 from the number passed in the feature file
    dataArray.push(data.medication[i])
  }
  return dataArray
}

function addResource(table){
  switch (table[0].addResource) {
    case 'communicationRequest':
      addRefId = true
      let commData = get_communicationRequestTemplate()
      refIdList.push(commData.fullUrl)
      commData.resource.payload[0].contentString = table[0].additionalInstructions
      data.entry.push(commData)
      break
    case 'MedReqNotes':
      for (const entry of data.entry) {
        if (entry.resource.resourceType == "MedicationRequest") {
          entry["resource"]["note"] = [{"text":table[0].additionalInstructions}];
        }
      }
      break
    case 'addEndorsement':
      misc.endorsement.valueCodeableConcept.coding[0].code = table[0].addEndorsementCode
      misc.endorsement.valueCodeableConcept.coding[0].display = table[0].addEndorsementDisplay
      for (const entry of data.entry) {
        if (entry.resource.resourceType == "MedicationRequest") {
          entry.resource.extension.push(misc.endorsement)
        }
      }
      break
    default:
      console.error(`${table[0].addResource} undefined`)
  }
}

function setRepeatOrERDAttributes(entry, table) {

  let medRepInfo = misc.medicationRepeatInfo
  if (table[0].prescriptionType == "repeat") {
    entry.resource.extension.push(medRepInfo)
    entry.resource.intent = "instance-order"
    entry["resource"]["basedOn"] = misc.basedon.basedOn
    entry.resource.courseOfTherapyType.coding[0].code = "continuous"
    entry.resource.courseOfTherapyType.coding[0].display = "Continuous long term therapy"
    entry["resource"]["dispenseRequest"]["numberOfRepeatsAllowed"] = 0
  }
  else if (table[0].prescriptionType == "erd") {
    medRepInfo.extension.splice(0, 1)
    entry.resource.extension.push(medRepInfo)
    entry.resource.intent = "original-order"
    entry.resource.courseOfTherapyType.coding[0].system = "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy"
    entry.resource.courseOfTherapyType.coding[0].code = "continuous-repeat-dispensing"
    entry.resource.courseOfTherapyType.coding[0].display = "Continuous long term (repeat dispensing)"
    entry["resource"]["dispenseRequest"]["numberOfRepeatsAllowed"] = table[0].numberOfRepeatsAllowed
  }
}
