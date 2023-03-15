import * as crypto from "crypto";
import * as misc from '../testData/misc_json'
import {Req}  from '../src/configs/spec'
import {
  get_DispenseTemplate, get_medDispenseTemplate,
  get_medRequestTemplate,
  get_ProvenanceTemplate,
  get_ReleaseTemplate
} from "./templates";
import instance from "../src/configs/api";
import fs from "fs";
let jwt = require("../services/getJWT")

const genid = require("./genId");



let shortPrescId = ""
let longPrescId = ""
let identifierValue = ""
let data = null;
//const resourceId = crypto.randomUUID()
const digests = new Map();
export async function preparePrescription(number, site, medReqNo = 1, table = null){
  const body = new Map()
  let resp = null
  const refIdList = []
  let addRefId = false
  const authoredOn = new Date().toISOString()
  let position = 2

  for (let i = 0; i < number; i++) {
    shortPrescId = genid.shortPrescId()
    longPrescId = crypto.randomUUID()
    console.log(shortPrescId)
    let data  = require('../testData/eps_prepare.json');

    if (medReqNo > 1) {

      for (const medReq of addMedReq(medReqNo)){
        //data.entry.push(medReq)
        data.entry.splice(position, 0, (medReq))
        refIdList.push(medReq.fullUrl)
        position += 1
      }
      addRefId = true
    }
    setBundleIdAndValue(data)

    const medReq = "cb17f5a-11ac-4e18-825f-6470467238b4"

    for (const entry of data.entry) {
      // if (entry.resource.resourceType == "MessageHeader" && i > 0) {
      //   entry.resource.focus[1].reference = `urn:uuid:${medReq}`
      // }
      if (entry.resource.resourceType == "MedicationRequest") {
        // if(i > 0) {
        //   entry.resource.id = medReq
        //   entry.fullUrl = `urn:uuid:${medReq}`
        // }
        if (table != null ) {
          if (table[0].hasOwnProperty("removeBlock")) {
            removeJsonBlock(table, entry)
          } else {
            entry.resource.medicationCodeableConcept.coding[0].code = table[0].snomedId
            entry.resource.medicationCodeableConcept.coding[0].display = table[0].medItem
            entry.resource.dispenseRequest.quantity.value = table[0].quantity
            entry.resource.dosageInstruction[0].text = table[0].dosageInstructions
            if (table[0].hasOwnProperty("addEndorsementCode")) {
              let endorsement = misc.endorsement
              endorsement.valueCodeableConcept.coding[0].code = table[0].addEndorsementCode
              endorsement.valueCodeableConcept.coding[0].display = table[0].addEndorsementDisplay
              entry.resource.extension.push(endorsement)
            }
          }
        }

        entry.resource.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
        entry.resource.groupIdentifier.value = shortPrescId
        entry.resource.authoredOn = authoredOn
        entry.resource.dispenseRequest.performer.identifier.value = site
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
  //body.forEach(value => console.log( value))
  //console.log(body.entries())
  //console.log(digests)
  let signatures = jwt.getSignedSignature(digests, valid)
  for (let [key, value] of body[1].entries()) {
  //body.forEach (async function (key, value) {
    let prov = get_ProvenanceTemplate()
    let uid = crypto.randomUUID();
    prov.resource.id = uid;
    prov.fullUrl = "urn:uuid:" + uid;
    //prov.resource.target[0].reference = "urn:uuid:" + resourceId;
    prov.resource.recorded = new Date().toISOString();
    prov.resource.signature[0].data = signatures.get(key);
    //prov.resource.signature[0].data = "PFNpZ25hdHVyZSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyI+CiAgICAgICAgICAgIAogICAgICAgICAgICA8U2lnbmF0dXJlVmFsdWU+PC9TaWduYXR1cmVWYWx1ZT4KICAgICAgICAgICAgPEtleUluZm8+PFg1MDlEYXRhPjxYNTA5Q2VydGlmaWNhdGU+PC9YNTA5Q2VydGlmaWNhdGU+PC9YNTA5RGF0YT48L0tleUluZm8+CiAgICAgICAgICA8L1NpZ25hdHVyZT4="
    prov.resource.signature[0].when = new Date().toISOString();
    let bodyData = JSON.parse(value)
    bodyData.entry.push(prov);
    //console.log("Nnnnnnnnnnnnnnnnnnnnnnnnmf------------- " + JSON.stringify(bodyData))
    //body.get(key).entry.push

    setNewRequestIdHeader()
    return await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#prescription-order`, bodyData)
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
  return await Req().post(`${process.env.eps_path}/FHIR/R4/Task/$release`, data)
}

export async function sendDispenseNotification(code, dispenseType, site, quantity = [0], medDispNo = 1, notifyCode = '000'){
  const refIdList = []
  let addRefId = false
  //const authoredOn = new Date().toISOString()
  let position = 2
  data = get_DispenseTemplate()
  if (medDispNo > 1) {

    for (const medDisp of addMedDisp(medDispNo)){
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
      entry.resource.type.coding[0].code = code[i]
      entry.resource.type.coding[0].display = dispenseType[i]
      if (notifyCode == '000'){
        setExtension(code[i], entry, quantity[i])
      } else {
        setExtension(notifyCode, entry, quantity[i])
      }
      i += 1
    }
    updateMessageHeader(entry, addRefId, refIdList, site)

    if (entry.resource.resourceType == "Organization") {
      entry.resource.identifier[0].value = site
    }
  }

  setNewRequestIdHeader()
  const resp = await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#dispense-notification`, data)
}

export async function amendDispenseNotification(itemNo, code, dispenseType){
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
  data.entry[itemNo].resource.type.coding[0].code = code
  data.entry[itemNo].resource.type.coding[0].display = dispenseType
  await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#dispense-notification`, data)
}

function setNewRequestIdHeader(){
  instance.interceptors.request.use(config => {
    config.headers["X-Request-ID"] = crypto.randomUUID();
    return config;
  });
}

function setBundleIdAndValue(data){
  identifierValue = crypto.randomUUID()
  data.id = crypto.randomUUID();
  data.identifier.value = identifierValue;
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

function addMedReq(number){
  if (number > 5) {
    console.error('ERROR!!!!!!!!!!!, See below message')
    throw new Error('Currently supporting a maximum of 5 MedicationRequests for prepare process, to add more, the json data need to be extended');
  }
  let dataArray = []
  let data = get_medRequestTemplate()
  for (let i = 0; i < number - 1; i++) { //As we adding one default Med Request, we need to remove 1 from the number passed in the feature file
    dataArray.push(data.medication[i])
  }
  return dataArray
}

function addMedDisp(number){
  if (number > 3) {
    console.error('ERROR!!!!!!!!!!!, See below message')
    throw new Error('Currently supporting a maximum of 3 MedicationDispense at the moment, to add more, the json data need to be extended');
  }
  let dataArray = []
  let data = get_medDispenseTemplate()
  for (let i = 0; i < number - 1; i++) { //As we adding one default Med Request, we need to remove 1 from the number passed in the feature file
    dataArray.push(data.medication[i])
  }
  return dataArray

}
