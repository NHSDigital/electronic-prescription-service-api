import Mustache from "mustache"
import fs from "fs"
import moment from "moment"
import path from "path"
import * as uuid from "uuid"

const ebxml_request_template = fs.readFileSync(path.join(__dirname, "../resources/ebxml_request.mustache"), "utf-8")

class EbXmlRequest {
    from_party_id = process.env.FROM_PARTY_KEY
    to_party_id = process.env.TO_PARTY_KEY
    cpa_id = process.env.CPA_ID
    conversation_id = uuid.v4().toUpperCase()
    service = "urn:nhs:names:services:mm"
    message_id = uuid.v4().toUpperCase()
    timestamp = moment.utc().format()

    //These are the parameters for async reliable, as this is the only messaging pattern we need for EPS.
    duplicate_elimination = true
    ack_requested = true
    ack_soap_actor = "urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH"
    sync_reply = true

    hl7_message: string
    action: string

    constructor(interactionId: string, hl7V3Message: string) {
        this.action = interactionId
        this.hl7_message = hl7V3Message
    }
}

export function addEbXmlWrapper(hl7V3Message: string): string {
    return Mustache.render(ebxml_request_template, new EbXmlRequest("PORX_IN020101UK31", hl7V3Message))
}
