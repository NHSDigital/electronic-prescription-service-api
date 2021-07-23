import Mustache from "mustache"
import fs from "fs"
import moment from "moment"
import path from "path"
import * as uuid from "uuid"
import {ElementCompact} from "xml-js"
import {namespacedCopyOf, writeXmlStringPretty} from "../serialisation/xml"
import {spine, hl7V3} from "@models"
import {getPartyKey, getRequestId} from "../../utils/headers"
import Hapi from "@hapi/hapi"

const ebxmlRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../resources/ebxml_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

class EbXmlRequest {
  timestamp = moment.utc().format()
  conversation_id = uuid.v4().toUpperCase()
  to_party_id = process.env.TO_PARTY_KEY
  service = "urn:nhs:names:services:mm"
  cpa_id = "S1001A1630"
  duplicate_elimination = true
  ack_requested = true
  ack_soap_actor = "urn:oasis:names:tc:ebxml-msg:actor:toPartyMSH"
  sync_reply = true

  message_id: string
  action: string
  hl7_message: string
  from_party_id: string

  constructor(interactionId: string, hl7V3Message: string, requestId: string, fromPartyKey: string) {
    this.action = interactionId
    this.hl7_message = hl7V3Message
    this.message_id = requestId
    this.from_party_id = fromPartyKey
  }
}

export function addEbXmlWrapper(spineRequest: spine.SpineRequest): string {
  const ebXmlRequest = new EbXmlRequest(spineRequest.interactionId, spineRequest.message, spineRequest.messageId,
    spineRequest.fromPartyKey)
  return Mustache.render(ebxmlRequestTemplate, ebXmlRequest)
}

export function toSpineRequest<T>(
  sendMessagePayload: hl7V3.SendMessagePayload<T>,
  headers: Hapi.Util.Dictionary<string>
): spine.SpineRequest {
  const messageId = getRequestId(headers)
  const fromPartyKey = getPartyKey(headers)
  return {
    interactionId: extractInteractionId(sendMessagePayload),
    message: writeToString(sendMessagePayload),
    messageId,
    fromPartyKey
  }
}

function extractInteractionId<T>(sendMessagePayload: hl7V3.SendMessagePayload<T>): string {
  return sendMessagePayload.interactionId._attributes.extension
}

function writeToString<T>(sendMessagePayload: hl7V3.SendMessagePayload<T>): string {
  const root: ElementCompact = {
    _declaration: new XmlDeclaration()
  }
  const interactionId = extractInteractionId(sendMessagePayload)
  root[interactionId] = namespacedCopyOf(sendMessagePayload)
  return writeXmlStringPretty(root)
}

export class XmlDeclaration {
  _attributes = {
    version: "1.0",
    encoding: "UTF-8"
  }
}
