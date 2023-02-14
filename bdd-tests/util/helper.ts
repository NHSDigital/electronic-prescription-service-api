import * as crypto from "crypto";
import * as misc from '../pacts/misc_json'
import {Req}  from '../src/configs/spec'
import {get_DispenseTemplate, get_ProvenanceTemplate, get_ReleaseTemplate} from "../util/templates";
import instance from "../src/configs/api";
import fs from "fs";
let jwt = require("../services/getJWT")

const genid = require("./genId");
//const crypto = require("crypto");


let shortPrescId = ""
let longPrescId = ""
//const resourceId = crypto.randomUUID()
const digests = new Map();
export async function preparePrescription(number){
  const body = new Map()

  for (let i = 0; i < number; i++) {
    shortPrescId = genid.shortPrescId()
    longPrescId = crypto.randomUUID()
    console.log(shortPrescId)
    let data  = require('../pacts/eps_prepare.json');
    //let prescriptionObj = JSON.parse(data)
    // data.id = crypto.randomUUID();
    // data.identifier.value = crypto.randomUUID();
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
        entry.resource.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
        entry.resource.groupIdentifier.value = shortPrescId
        entry.resource.authoredOn = new Date().toISOString()
      }
      if (entry.resource.resourceType == "MessageHeader") {
        entry.fullUrl = "urn:uuid:" + crypto.randomUUID();
      }
    }

    //console.log(JSON.stringify(data))


    let resp = await Req().post(`${process.env.eps_path}/FHIR/R4/$prepare`, data)
    digests.set(shortPrescId, resp.data.parameter[0].valueString)
    //body.set(shortPrescId, data)
    body.set(shortPrescId, JSON.stringify(data)) // can't iterate over object in map, so converting to json string
  }
  return body
}
export async function createPrescription(number, site, valid=true){
  let body = await preparePrescription(number)
  //body.forEach(value => console.log( value))
  //console.log(body.entries())
  //console.log(digests)
  let signatures = jwt.getSignedSignature(digests, valid)
  for (let [key, value] of body.entries()) {
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
    console.log("Nnnnnnnnnnnnnnnnnnnnnnnnmf------------- " + JSON.stringify(value))
    //body.get(key).entry.push

    setNewRequestIdHeader()
    const resp = await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#prescription-order`, bodyData)
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
    }
  }
  setNewRequestIdHeader()
  const resp = await Req().post(`${process.env.eps_path}/FHIR/R4/Task/$release`, data)
}

export async function sendDispenseNotification(code, dispenseType){
  let data = get_DispenseTemplate()
  setBundleIdAndValue(data)
  for (const entry of data.entry) {
    if (entry.resource.resourceType == "MedicationDispense" ) {
      for (const contained of entry.resource.contained) {
        if (contained.resourceType == "MedicationRequest") {
          contained.groupIdentifier.extension[0].valueIdentifier.value = longPrescId
          contained.groupIdentifier.value = shortPrescId
          contained.authoredOn = new Date().toISOString()
        }
      }
      entry.resource.type.coding[0].code = code
      entry.resource.type.coding[0].display = dispenseType
      setExtension(code, entry)

    }
    if (entry.resource.resourceType == "MessageHeader") {
      entry.fullUrl = "urn:uuid:" + crypto.randomUUID();
    }
  }

  setNewRequestIdHeader()
  const resp = await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#dispense-notification`, data)
}

function setNewRequestIdHeader(){
  instance.interceptors.request.use(config => {
    config.headers["X-Request-ID"] = crypto.randomUUID();
    return config;
  });
}

function setBundleIdAndValue(data){
  data.id = crypto.randomUUID();
  data.identifier.value = crypto.randomUUID();
}

function setExtension(code, entry){
  switch (code) {
    case '0001':
      entry.resource.extension[0].valueCoding.code = '0006';
      entry.resource.extension[0].valueCoding.display = 'Dispensed';
      break;
    case '0004':
      entry.resource.extension[0].valueCoding.code = '0003';
      entry.resource.extension[0].valueCoding.display = 'With Dispenser - Active';
      break;
    case '*':
      entry.resource.extension[0].valueCoding.code = '0006';
      entry.resource.extension[0].valueCoding.display = 'Dispensed';
      break;
    case '0002':
      entry.resource.extension[0].valueCoding.code = '0001';
      entry.resource.extension[0].valueCoding.display = 'To be Dispensed';
      entry["resource"][misc.statusReasonkey] = misc.statusReason;
      break;
    case '0003':
      entry.resource.extension[0].valueCoding.code = '0001';
      entry.resource.extension[0].valueCoding.display = 'To be Dispensed';
      break;
  }



}

