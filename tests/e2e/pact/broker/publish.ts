import path from "path"
import { Publisher } from "@pact-foundation/pact"

async function publish(): Promise<Array<string>> { 
  const isLocal = process.env.PACT_PROVIDER_URL == "http://localhost:9000"
  if (!isLocal) {
    return await new Publisher({
      pactBroker: process.env.PACT_BROKER_URL,
      pactBrokerUsername: process.env.PACT_BROKER_BASIC_AUTH_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_BASIC_AUTH_PASSWORD,
      consumerVersion: process.env.PACT_VERSION,
      tags: [process.env.PACT_VERSION],
      pactFilesOrDirs: [
        path.join(__dirname, "../pact/pacts")
      ]
    })
    .publishPacts()
  }
  return Promise.resolve([])
}

(async () => {
  publish().then(result => console.log(result)).catch(publish).catch(publish)
})()