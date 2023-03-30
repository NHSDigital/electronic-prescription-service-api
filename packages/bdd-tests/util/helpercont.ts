import * as crypto from "crypto";
import * as misc from '../testData/misc_json'
import {Req}  from '../src/configs/spec'
import {
  get_ClaimTemplate
} from "./templates";
import instance from "../src/configs/api";
import {addItemReq, longPrescId, shortPrescId} from "./helper";

let data = null;
let resp = null
let identifierValue = ""
const authoredOn = new Date().toISOString()

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
  setBundleIdAndValue(data)
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

function setBundleIdAndValue(data){
  identifierValue = crypto.randomUUID()
  data.id = crypto.randomUUID();
  data.identifier[0].value = identifierValue;
}
