import {ParentPrescription} from "../services/hl7-v3-prescriptions";
import {ElementCompact, xml2js} from "xml-js";
import * as fs from "fs"
import * as path from "path"

export const wrap = function (payload: ParentPrescription): ElementCompact {
    const options = {compact: true}
    const wrapperStr = fs.readFileSync(path.join(__dirname, "./ConvertWrapper.xml"), "utf8")
    const wrapperJson = xml2js(wrapperStr, options) as ElementCompact
    wrapperJson.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription = payload
    return wrapperJson
}
