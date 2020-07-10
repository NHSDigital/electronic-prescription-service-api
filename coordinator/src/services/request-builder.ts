import Mustache from "mustache"
import fs from "fs"
import moment from "moment"
import path from "path"
import * as uuid from "uuid"

const ebxmlRequestTemplate = fs.readFileSync(path.join(__dirname, "../resources/ebxml_request.mustache"), "utf-8").replace(/\n/g, "\r\n")
const cpaIdMap = new Map<string, string>(JSON.parse(process.env.CPA_ID_MAP))

class EbXmlRequest {
    timestamp = moment.utc().format()
    conversation_id = uuid.v4().toUpperCase()
    message_id = uuid.v4().toUpperCase()
    from_party_id = process.env.FROM_PARTY_KEY
    to_party_id = process.env.TO_PARTY_KEY
    service = "urn:nhs:names:services:mm"

    //These are the parameters for async reliable, as this is the only messaging pattern we need for now.
    //TODO - If we change from async reliable, change these parameters.
    duplicate_elimination = true
    ack_requested = true
    ack_soap_actor = "urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH"
    sync_reply = true

    action: string
    cpa_id: string
    hl7_message: string

    constructor(interactionId: string, cpaId: string, hl7V3Message: string) {
        this.action = interactionId
        this.cpa_id = cpaId
        this.hl7_message = hl7V3Message
    }
}

export function addEbXmlWrapper(hl7V3Message: string): string {
    const interactionId = "PORX_IN020101UK31"
    const cpaId = cpaIdMap.get(interactionId)
    return Mustache.render(ebxmlRequestTemplate, new EbXmlRequest(interactionId, cpaId, hl7V3Message))
}
