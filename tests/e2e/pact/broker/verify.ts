import { VerifierV3 } from "@pact-foundation/pact"

async function verify(provider: string) { 
  const verifier =  new VerifierV3({
    publishVerificationResult: true,
    consumerVersionTag: process.env.BUILD_VERSION,
    providerVersion: process.env.BUILD_VERSION,
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    provider: provider,
    providerBaseUrl: `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/${process.env.SERVICE_BASE_PATH}`,
    logLevel: "info",
    requestFilter: (req) => {
      req.headers["x-smoke-test"] = "1"
      if (process.env.APIGEE_ACCESS_TOKEN)
      {
        req.headers["Authorization"] = `Bearer: ${process.env.APIGEE_ACCESS_TOKEN}`
      }
      return req
    }
  })
  
  await verifier.verifyProvider().catch(err => console.log(err))
}

verify(process.env.PACT_PROVIDER)