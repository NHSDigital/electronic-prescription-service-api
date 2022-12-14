import {hl7V3} from "@models"
import {ElementCompact} from "xml-js"
import pino from "pino"
import {inflateSync} from "zlib"
import {readXml} from "../../serialisation/xml"

const getXmlMessageBody = (message: string): ElementCompact => {
  const xml = readXml(message)
  return xml["SOAP:Envelope"]["SOAP:Body"]
}

const extractSpineErrorDescription = (message: string): string => {
  const body = getXmlMessageBody(message)
  const faultSection = body["SOAP:Fault"]
  const faultDescription = faultSection["detail"]["nasp:errorList"]["nasp:error"]["nasp:description"]._text
  return faultDescription
}

const extractPrescriptionDocumentKey = (message: string): string => {
  const body = getXmlMessageBody(message)
  const queryResponse = body.prescriptionDetailQueryResponse
  // eslint-disable-next-line max-len
  return queryResponse.PORX_IN000006UK99.ControlActEvent.subject.PrescriptionJsonQueryResponse.epsRecord.prescriptionMsgRef._text
}

const extractPrescriptionDocument = (message: string): ElementCompact => {
  const body = getXmlMessageBody(message)
  const documentResponse = body.prescriptionDocumentResponse.GET_PRESCRIPTION_DOCUMENT_RESPONSE_INUK01
  return documentResponse.ControlActEvent.subject.document
}

const isGetPrescriptionDocumentResponse = (documentType: string): boolean => {
  const wasHl7v3Prescribed = documentType === "PORX_IN020101UK31"
  const wasFHIRPrescribed = documentType === "PORX_IN020101SM31"
  return wasHl7v3Prescribed || wasFHIRPrescribed
}

const extractHl7v3PrescriptionFromMessage = (
  message: string,
  logger: pino.Logger
): hl7V3.ParentPrescription => {
  const document = extractPrescriptionDocument(message)
  const documentType = extractPrescriptionDocumentType(document)

  if (!isGetPrescriptionDocumentResponse(documentType)) {
    logger.error(`Tracker - got incorrect documentType: '${documentType}'`)
    return null
  }

  // decode the content and return the hl7v3 prescription
  const documentContent = extractPrescriptionDocumentContent(document)
  logger.info(`Tracker - Extracted prescription document`)

  const decodedContent = Buffer.from(documentContent, "base64")
  logger.info(`Tracker - Decoded prescription document content`)

  const content = inflateSync(decodedContent).toString("utf-8")
  logger.info(`Tracker - Decompressed prescription document content`)

  return getHl7v3Prescription(content)
}

const getHl7v3Prescription = (content: string) => {
  return readXml(content).ParentPrescription as hl7V3.ParentPrescription
}

const extractPrescriptionDocumentType = (document: ElementCompact): string => {
  return document.documentType._attributes.value
}

const extractPrescriptionDocumentContent = (document: ElementCompact): string => {
  return document.content._attributes.value
}

export {
  extractPrescriptionDocumentKey,
  extractHl7v3PrescriptionFromMessage,
  extractSpineErrorDescription
}
