import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb"
import {xml2js} from "xml-js"
import * as zlib from "node:zlib"
import {ParentPrescriptionRoot} from "../../../models/hl7-v3"
import {getCertificateFromPrescriptionCrypto} from "../../src/services/verification/common"
import {verifyPrescriptionSignature} from "../../src/services/verification"
import pino from "pino"
import axios from "axios"

test("verify prescription signature", async () => {
  // 1. Prescription record is pulled from dynamodb
  // 2. Prescription creation document id is extracted
  // 3. Document is pulled from dynamodb and zlib decompressed
  // 4. x509 certificate is extracted from the document
  // 5. CA Issuer certificate is fetched and used by signature verification
  // 6. verifyPrescriptionSignature is called to verify the signature

  // Set prescription id below and run the test to verify a prescription signature
  const prescriptionId = "4C07DC-H81056-D2E9A"

  const ddbClient = new DynamoDBClient({region: "eu-west-2"})

  console.log("Fetching prescription record from DynamoDB...")
  const getRecordCommand = new GetItemCommand({
    TableName: "spine-eps-datastore",
    Key: {
      "pk": {S: `${prescriptionId.substring(0, 19)}`},
      "sk": {S: "REC"}
    }
  })
  const response = await ddbClient.send(getRecordCommand)
  if (!response.Item) {
    throw new Error(`Prescription record not found`)
  }

  const recordBinary = response.Item["body"]?.B

  console.log("Decompressing prescription record...")
  const decompressedRecord = zlib.unzipSync(recordBinary).toString("utf-8")
  const prescriptionRecord = JSON.parse(decompressedRecord)

  const parentPrescriptionDocumentId: string = prescriptionRecord["prescription"]["prescriptionMsgRef"]
  console.log(`Parent prescription document id: ${parentPrescriptionDocumentId}`)

  console.log("Fetching prescription document from DynamoDB...")
  const getDocumentCommand = new GetItemCommand({
    TableName: "spine-eps-datastore",
    Key: {
      "pk": {S: `${parentPrescriptionDocumentId}`},
      "sk": {S: "DOC"}
    }
  })
  const documentResponse = await ddbClient.send(getDocumentCommand)
  if (!documentResponse.Item) {
    throw new Error(`Prescription document not found`)
  }

  const documentBinary = documentResponse.Item["body"]?.M["content"]["B"]

  console.log("Decompressing prescription document...")
  const decompressedDocument = zlib.unzipSync(documentBinary).toString("utf-8")
  const prescriptionDocument = xml2js(decompressedDocument, {compact: true}) as ParentPrescriptionRoot

  const signature = prescriptionDocument
    .ParentPrescription
    .pertinentInformation1
    .pertinentPrescription
    .author
    .signatureText
  if (!signature) {
    throw new Error("No signature found on parent prescription")
  }

  console.log("Extracting x509 certificate...")
  const x509Certificate = getCertificateFromPrescriptionCrypto(signature)
  const caIssuerURI = x509Certificate.toLegacyObject()["infoAccess"]["CA Issuers - URI"][0]
  console.log(`CA Issuer URI: ${caIssuerURI}`)

  console.log("Fetching CA Issuer certificate...")
  const caIssuerResponse = await axios.get(caIssuerURI, {responseType: "arraybuffer"})
  if (caIssuerResponse.status !== 200) {
    throw new Error(`Failed to fetch CA Issuer certificate from ${caIssuerURI}`)
  }

  const caCert = caIssuerResponse.data.toString().startsWith("-----BEGIN CERTIFICATE-----") ?
    caIssuerResponse.data :
    `-----BEGIN CERTIFICATE-----\n${caIssuerResponse.data.toString("base64")}\n-----END CERTIFICATE-----`

  process.env.SUBCACC_CERT = caCert

  const verificationResponse = await verifyPrescriptionSignature(
    prescriptionDocument.ParentPrescription,
    console as unknown as pino.Logger
  )

  if(verificationResponse.length === 0) {
    console.log("Signature verification successful")
  }else {
    throw new Error(`Signature verification failed: ${JSON.stringify(verificationResponse)}`)
  }
})
