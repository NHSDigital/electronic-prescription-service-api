import path from "path"
import { Publisher } from "@pact-foundation/pact"

async function publish(): Promise<Array<string>> { 
  const isLocal = process.env.PACT_PROVIDER_URL == "http://localhost:9000"
  if (!isLocal) {
    return await new Publisher({
      pactBroker: process.env.PACT_BROKER_NEXT_URL,
      pactBrokerToken: process.env.PACT_BROKER_NEXT_TOKEN,
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
  publish().catch(publish).catch(publish)
})()