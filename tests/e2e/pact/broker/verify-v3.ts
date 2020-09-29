import { VerifierV3 } from "@pact-foundation/pact"

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(provider: string): Promise<any> { 
  const verifier =  new VerifierV3({
    publishVerificationResult: true,
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersionTag: process.env.BUILD_VERSION,
    provider: `${provider}-convert+${process.env.BUILD_VERSION}`,
    providerVersion: process.env.BUILD_VERSION,
    providerBaseUrl: `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/${process.env.SERVICE_BASE_PATH}`,
    logLevel: "info",
    requestFilter: (req) => {
      req.headers["x-smoke-test"] = "1"
      req.headers["Authorization"] = `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
      return req
    }
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify(process.env.PACT_PROVIDER).catch(console.error)
})()

