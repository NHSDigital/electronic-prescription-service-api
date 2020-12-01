import { VerifierV3 } from "@pact-foundation/pact"
import child from 'child_process'

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function verify(): Promise<any> { 
  const isLocal = process.env.PACT_PROVIDER_URL === "http://localhost:9000"
  const verifier =  new VerifierV3({
    publishVerificationResult: !isLocal,
    pactBrokerUrl: isLocal ? undefined : process.env.PACT_BROKER_URL,
    pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
    pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
    consumerVersionTag: process.env.PACT_VERSION,
    provider: `${process.env.PACT_PROVIDER}-convert+${process.env.PACT_VERSION}`,
    providerVersion: process.env.PACT_VERSION,
    providerBaseUrl: process.env.PACT_PROVIDER_URL,
    logLevel: isLocal? "debug" : "info",
    requestFilter: (req) => {
      req.headers["x-smoke-test"] = "1"
      console.log(`Attempting to get access token for ${process.env.IDP_URL}`)
      try {
        const command = `docker run --rm artronics/nhsd-login-docker:latest "${process.env.IDP_URL}"`
        const accessToken = child.execSync(command).toString().replace(/\n/g, "")
        console.log(`Subcommand response: ${accessToken}`)
        req.headers["Authorization"] = `Bearer ${accessToken}`
        return req
      } catch (error) {
        console.log(`Got an error fetching the access token: ${error}`)
      }
    },
    pactUrls: isLocal 
      ? [
        `${process.cwd()}/pact/pacts/${process.env.PACT_CONSUMER}+${process.env.PACT_VERSION}-${process.env.PACT_PROVIDER}-convert+${process.env.PACT_VERSION}.json`
      ]
      : []
  })
  
  return await verifier.verifyProvider()
}

(async () => {
  verify().catch(verify).catch(verify)
})()

