import {hl7V3} from "@models"
import {ElementCompact} from "xml-js"
import pino from "pino"
import {readXml} from "../serialisation/xml"

export const extractPrescriptionDocumentKey = (document: string): string => {
  const decodedXml = readXml(document)
  const queryResponse = decodedXml["SOAP:Envelope"]["SOAP:Body"].prescriptionDetailQueryResponse
  // todo: check if the attribute always exists - ask Alison
  // eslint-disable-next-line max-len
  return queryResponse.PORX_IN000006UK99.ControlActEvent.subject.PrescriptionJsonQueryResponse.epsRecord.prescriptionMsgRef._text
}

export const extractPrescriptionDocument = (xmlDocument: string): ElementCompact => {
  const decodedXml = readXml(xmlDocument)
  // eslint-disable-next-line max-len
  const documentResponse = decodedXml["SOAP:Envelope"]["SOAP:Body"].prescriptionDocumentResponse.GET_PRESCRIPTION_DOCUMENT_RESPONSE_INUK01
  return documentResponse.ControlActEvent.subject.document
}

export const extractPrescriptionDocumentType = (document: ElementCompact): string => {
  return document.documentType._attributes.value
}

export const extractPrescriptionDocumentContent = (document: ElementCompact): string => {
  return document.content._attributes.value
}

export const extractHl7v3PrescriptionFromDocument = (
  document: ElementCompact,
  logger: pino.Logger
): hl7V3.ParentPrescription => {
  const documentType = extractPrescriptionDocumentType(document)

  // check we have the document of type prescription
  const wasHl7v3Prescribed = documentType === "PORX_IN020101UK31"
  const wasFHIRPrescribed = documentType === "PORX_IN020101SM31"
  const wrongDocumentType = !wasHl7v3Prescribed && !wasFHIRPrescribed
  if (wrongDocumentType) {
    logger.error(`Tracker got incorrect documentType '${documentType}'`)
    return null
  }

  // decode the content and return the hl7v3 prescription
  const documentContent = extractPrescriptionDocumentContent(document)
  logger.info(`Extracted prescription document: ${documentContent}`)

  const decodedContent = Buffer.from(documentContent, "base64").toString("utf-8")
  logger.info(`Decoded prescription document content ${documentContent}`)

  const hl7v3Prescription = readXml(decodedContent) as hl7V3.ParentPrescription

  return hl7v3Prescription
}
