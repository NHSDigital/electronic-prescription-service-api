import { VerifierV3 } from "@pact-foundation/pact"

async function verify(provider: string): Promise<void> { 
  const verifier =  new VerifierV3({
    publishVerificationResult: true,
    providerVersion: process.env.BUILD_VERSION,
    consumerVersionTag: process.env.BUILD_VERSION,
    providerVersionTag: process.env.BUILD_VERSION,
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    provider: provider,
    providerBaseUrl: `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/${process.env.SERVICE_BASE_PATH}`,
    logLevel: "trace",
    requestFilter: (req) => {
      req.headers["x-smoke-test"] = "1"
      if (process.env.APIGEE_ACCESS_TOKEN)
      {
        req.headers["Authorization"] = `Bearer: ${process.env.APIGEE_ACCESS_TOKEN}`
      }
      return req
    },
    pactUrls: [
      `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}-${process.env.PACT_PROVIDER}.json`
    ]
  })
  
  await verifier.verifyProvider().then(() => "ran verify provider")
}

verify(process.env.PACT_PROVIDER).then(() => console.log("ran main")).catch(console.error)