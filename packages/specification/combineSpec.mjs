import pkg from 'yaml'
const { parse, stringify } = pkg
import { readFileSync, writeFileSync } from 'fs'
import { isEqual } from 'lodash-es';

function getObjectDiff(obj1, obj2) {
    const diff = Object.keys(obj1).reduce((result, key) => {
        if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
            result.push(key);
        } else if (isEqual(obj1[key], obj2[key])) {
            const resultKeyIndex = result.indexOf(key);
            result.splice(resultKeyIndex, 1);
        }
        return result;
    }, Object.keys(obj2));

    return diff;
}

const rawPrescribing = readFileSync('./fhir-prescribing.yaml', 'utf8')
const rawDispensing = readFileSync('./fhir-dispensing.yaml', 'utf8')
const rawTemplate = readFileSync('./electronic-prescription-service-api.template.yaml', 'utf8')
let prescribing = parse(rawPrescribing)
let dispensing = parse(rawDispensing)
let template = parse(rawTemplate)
const exclusionList = ['/FHIR/R4/$process-message', '/FHIR/R4/Task']

// add the paths
console.log("Adding prescribing.paths")
for (const [key, value] of Object.entries(prescribing.paths)) {
    const existingValue = template.paths[key]
    if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(value)) {
        throw new Error(`Duplicate key ${key} and values are different`)
    }
    if (exclusionList.indexOf(key) >= 0) {
        console.log(`not adding ${key} as it is in exclusion list`)
    } else {
        delete value["post"]["security"]
        template.paths[key] = value
    }
}

console.log("Adding dispensing.paths")
for (const [key, value] of Object.entries(dispensing.paths)) {
    const existingValue = template.paths[key]
    if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(value)) {
        throw new Error(`Duplicate key ${key} and values are different`)
    }
    if (exclusionList.indexOf(key) >= 0) {
        console.log(`not adding ${key} as it is in exclusion list`)
    } else {
        delete value["post"]["security"]
        template.paths[key] = value
    }
}

// add the parameters
console.log("Adding prescribing.components.parameters")
for (const [key, value] of Object.entries(prescribing.components.parameters)) {
    const existingValue = template.components.parameters[key]
    if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(value)) {
        throw new Error(`Duplicate key ${key} and values are different`)
    }
    template.components.parameters[key] = value
}

console.log("Adding dispensing.components.parameters")
for (const [key, value] of Object.entries(dispensing.components.parameters)) {
    const existingValue = template.components.parameters[key]
    if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(value)) {
        throw new Error(`Duplicate key ${key} and values are different`)
    }
    template.components.parameters[key] = value
}

// add the schemas
console.log("Adding prescribing.components.schemas")
for (const [key, value] of Object.entries(prescribing.components.schemas)) {
    const existingValue = template.components.schemas[key]
    if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(value)) {
        throw new Error(`Duplicate key ${key} and values are different`)
    }
    template.components.schemas[key] = value
}

console.log("Adding dispensing.components.schemas")
for (const [key, value] of Object.entries(dispensing.components.schemas)) {
    const existingValue = template.components.schemas[key]
    if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(value)) {
        throw new Error(`Duplicate key ${key} and values are different`)
    }
    template.components.schemas[key] = value
}

writeFileSync('./electronic-prescription-service-api.new.yaml', stringify(template))


const oldRawSpec = readFileSync('./electronic-prescription-service-api.yaml', 'utf8')
let oldSpec = parse(oldRawSpec)

const areTheyTheSame = getObjectDiff(
    oldSpec.paths, 
    template.paths
)
console.log(`are they the same: ${areTheyTheSame}`)


const areTheyTheSameDetails = getObjectDiff(
    oldSpec.paths["/FHIR/R4/Task#withdraw"]["post"], 
    template.paths["/FHIR/R4/Task#withdraw"]["post"]
)
console.log(`are they the same: ${areTheyTheSameDetails}`)
