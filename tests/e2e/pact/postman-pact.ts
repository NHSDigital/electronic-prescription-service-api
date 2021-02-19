import * as fs from 'fs'
import * as path from "path"
import { pactGroupNames } from './resources/common'

function createPostmanCollection() {
    const endpoints = ["Prepare", "Process"]
    const pactVersion = process.env.PACT_VERSION.toLowerCase()

    endpoints.forEach(endpoint => {
        const postmanCollection = {
            info: {
                name: `Electronic Prescription Service API - ${endpoint} Examples`,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            item: []
        }

        const endpointLower = endpoint.toLowerCase()

        pactGroupNames.forEach(group => {
            const pactString = fs.readFileSync(path.join(__dirname, `pact/pacts/nhsd-apim-eps-test-client+${pactVersion}-nhsd-apim-eps+${endpointLower}-${group}+${pactVersion}.json`), "utf8")
            const pact = JSON.parse(pactString)
            const postmanItems = pact.interactions.map(interaction => createPostmanItem(interaction))
            postmanCollection.item.push(...postmanItems)
        })

        const postmanCollectionString = JSON.stringify(postmanCollection, null, 2)

        fs.writeFileSync(path.join(__dirname, `../postman/collections/electronic-prescription-service-${endpoint}.json`), postmanCollectionString)
    })
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
                    host: [ `https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk`],
                    path: [
                        "electronic-prescriptions",
                        ...interaction.request.path.substring(1).split('/')
                    ],
                    query: []
                }
            },
            response: [],
            event: []
    }

    for (const [key, value] of Object.entries(interaction.request.headers)) {
        item.request.header.push({key, value})
    }

    item.request.header.push({key: "Authorization", value: `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`})

    return item
}
