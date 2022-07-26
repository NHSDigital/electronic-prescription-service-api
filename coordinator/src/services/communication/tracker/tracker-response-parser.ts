import {hl7V3} from "@models"
import {ElementCompact} from "xml-js"
import pino from "pino"
import {inflateSync} from "zlib"
import {readXml} from "../../serialisation/xml"

export const extractPrescriptionDocumentKey = (message: string): string => {
  const xml = readXml(message)
  const queryResponse = xml["SOAP:Envelope"]["SOAP:Body"].prescriptionDetailQueryResponse
  // eslint-disable-next-line max-len
  return queryResponse.PORX_IN000006UK99.ControlActEvent.subject.PrescriptionJsonQueryResponse.epsRecord.prescriptionMsgRef._text
}

export const extractHl7v3PrescriptionFromMessage = (
  message: string,
  logger: pino.Logger
): hl7V3.ParentPrescription => {
  const document = extractPrescriptionDocument(message)

  const documentType = extractPrescriptionDocumentType(document)

  // check we have the document of type prescription
  const wasHl7v3Prescribed = documentType === "PORX_IN020101UK31"
  const wasFHIRPrescribed = documentType === "PORX_IN020101SM31"
  const wrongDocumentType = !wasHl7v3Prescribed && !wasFHIRPrescribed
  if (wrongDocumentType) {
    logger.error(`Tracker - got incorrect documentType '${documentType}'`)
    return null
  }

  // decode the content and return the hl7v3 prescription
  const documentContent = extractPrescriptionDocumentContent(document)
  logger.info(`Tracker - Extracted prescription document: ${documentContent}`)

  const decodedContent = Buffer.from(documentContent, "base64")
  logger.info(`Tracker - Decoded prescription document content: ${decodedContent}`)

  const content = inflateSync(decodedContent).toString("utf-8")
  logger.info(`Tracker - Decompressed prescription document content: ${content}`)

  const hl7v3Prescription = readXml(content) as hl7V3.ParentPrescription

  return hl7v3Prescription
}

const extractPrescriptionDocument = (message: string): ElementCompact => {
  const xml = readXml(message)
  // eslint-disable-next-line max-len
  const documentResponse = xml["SOAP:Envelope"]["SOAP:Body"].prescriptionDocumentResponse.GET_PRESCRIPTION_DOCUMENT_RESPONSE_INUK01
  return documentResponse.ControlActEvent.subject.document
}

const extractPrescriptionDocumentType = (document: ElementCompact): string => {
  return document.documentType._attributes.value
}

const extractPrescriptionDocumentContent = (document: ElementCompact): string => {
  return document.content._attributes.value
}
