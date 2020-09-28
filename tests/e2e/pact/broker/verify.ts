/* eslint-disable */
import path from "path"
import { Verifier } from "@pact-foundation/pact"

async function verify(provider: string): Promise<any> { 
  const verifier =  new Verifier({
    publishVerificationResult: true,
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersionSelectors: [
      {
        pacticipant: process.env.PACT_CONSUMER,
        version: process.env.BUILD_VERSION
      }
    ],
    provider: provider,
    providerVersion: process.env.BUILD_VERSION,
    providerBaseUrl: `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/${process.env.SERVICE_BASE_PATH}`,
    logLevel: "info",
    requestFilter: (req, res, next) => {
      req.headers["x-smoke-test"] = "1"
      if (process.env.APIGEE_ACCESS_TOKEN)
      {
        req.headers["Authorization"] = `Bearer: ${process.env.APIGEE_ACCESS_TOKEN}`
      }
      next()
    }
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify(process.env.PACT_PROVIDER).catch(console.error)
})()

