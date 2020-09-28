/* eslint-disable */
import path from "path"
import { Verifier } from "@pact-foundation/pact"

async function verify(provider: string): Promise<any> { 
  const verifier =  new Verifier({
    publishVerificationResult: true,
    providerVersion: process.env.BUILD_VERSION,
    consumerVersionTags: process.env.BUILD_VERSION,
    providerVersionTags: process.env.BUILD_VERSION,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    provider: provider,
    changeOrigin: true,
    validateSSL: false,
    providerBaseUrl: `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/${process.env.SERVICE_BASE_PATH}`,
    logLevel: "info",
    requestFilter: (req) => {
      req.headers["x-smoke-test"] = "1"
      if (process.env.APIGEE_ACCESS_TOKEN)
      {
        req.headers["Authorization"] = `Bearer: ${process.env.APIGEE_ACCESS_TOKEN}`
      }
      return req
    },
    pactUrls: [
      //`${process.env.PACT_BROKER_URL}/pacts/provider/${process.env.PACT_PROVIDER}/consumer/${process.env.PACT_CONSUMER}/version/${process.env.BUILD_VERSION}`,
      path.resolve(process.cwd(), `pact/pacts/${process.env.PACT_CONSUMER}-${process.env.PACT_PROVIDER}.json`)
    ]
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify(process.env.PACT_PROVIDER).catch(console.error)
})()

