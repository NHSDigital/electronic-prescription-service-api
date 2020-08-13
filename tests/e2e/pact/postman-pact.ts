import * as fs from 'fs'
import * as path from "path"
import * as LosslessJson from "lossless-json"

function createPostmanCollection() {
  const pactString = fs.readFileSync(path.join(__dirname, "pact/pacts/nhsd-apim-eps-test-client-nhsd-apim-eps.json"), "utf8")
  const pact = LosslessJson.parse(pactString)

  const postmanCollection = {
    info: {
      name: "Electronic Prescription Service API",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: []
  }
  postmanCollection.item = pact.interactions.map(interaction => createPostmanItem(interaction))

  const postmanCollectionString = JSON.stringify(postmanCollection, null, 2)
  fs.writeFileSync(path.join(__dirname, "../postman/collections/electronic-prescription-service-collection.json"), postmanCollectionString)
}

createPostmanCollection()

function createPostmanItem(interaction) {
  const item = {
    name: interaction.description,
    request: {
      method: interaction.request.method,
      header: [],
      body: {
        mode: 'raw',
        raw: JSON.stringify(interaction.request.body, null, 2)
      },
      url: {
        raw: `{{url}}${interaction.request.path}`,
        host: [`{{url}}`],
        path: interaction.request.path.split('/'),
        query: []
      }
    },
    response: [],
    event: []
  }

  for (const [key, value] of Object.entries(interaction.request.headers)) {
    item.request.header.push({key, value})
  }

  return item
}
