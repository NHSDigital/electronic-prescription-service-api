import "./site.css"
import {pageData} from "./ui/state"
import {makeRequest} from "./api/make-request"
import {initialiseTestPack} from "./test-pack"
import {
  sanitiseProdTestData,
  updateBundleIds,
  updateValidityPeriodIfRepeatDispensing
} from "./parsers/write/bundle-parser"
import {Rivets} from "rivets"
import {Extension} from "fhir/r4"
import {MetadataResponse, SoftwareVersion} from "./ui/view-models"

const customWindow = window as Record<string, any>

customWindow.updateAuthMethod = async function (authMethod: string) {
  const response = await makeRequest(
    "POST",
    `${pageData.baseUrl}change-auth`,
    JSON.stringify({authMethod: authMethod})
  )
  window.location.href = response.redirectUri
}

customWindow.sendEditRequest = async function () {
  try {
    const bundles = getPayloads()
    bundles.forEach(bundle => {
      updateBundleIds(bundle)
      updateValidityPeriodIfRepeatDispensing(bundle)
      sanitiseProdTestData(bundle)
    })
    const response = await makeRequest(
      "POST",
      `${pageData.baseUrl}prescribe/edit`,
      JSON.stringify(bundles)
    )
    if (response.redirectUri) {
      window.location.href = encodeURI(response.redirectUri)
    } else {
      console.log("Failed to read prescription(s)")
    }
  } catch (e) {
    console.log(e)
    console.log("Failed to read prescription(s)")
  }
}

function setInitialState(mode: string, env: string, baseUrl: string) {
  toggleUiMode(mode)
  pageData.environment = getEnvironmentDisplay(env)
  pageData.baseUrl = baseUrl
}

customWindow.startApplication = async function (mode: string, env: string, baseUrl: string) {
  initialiseTestPack()
  setInitialState(mode, env, baseUrl)
  bind()
  showPage()
  await setEpsAndValidatorVersions()
}

export function resetPageData(pageMode: string): void {
  toggleUiMode(pageMode)
  pageData.showCustomExampleInput = pageMode === "load" ? pageData.selectedExampleId === "custom" : false
}
customWindow.resetPageData = resetPageData

function bind() {
  bindPageData()
  bindPrescriptionFileUpload()
}

function bindPrescriptionFileUpload() {
  document.getElementById("prescription-files").onchange = function (evt: InputEvent) {
    try {
      const files = (evt.target as HTMLInputElement).files
      if (!files.length) {
        return
      }
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader()
        reader.onload = event => {
          //eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          pageData.payloads.push(event.target.result)
        }
        reader.readAsText(files[i])
      }
    } catch (err) {
      console.error(err)
    }
  }
}

function bindPageData() {
  Rivets.bind(document.getElementById("main-content"), pageData)
}

function showPage() {
  document.getElementById("main-content").style.display = ""
}

async function setEpsAndValidatorVersions() {
  pageData.validatorPackages = await parseMetadataResponse()
}

function toggleUiMode(mode: string) {
  switch(mode) {
    case "login":
      pageData.isLogin = true
      pageData.isHome = false
      pageData.isLoad = false
      break
    case "home":
      pageData.isLogin = false
      pageData.isHome = true
      pageData.isLoad = false
      break
    case "load":
      pageData.isLogin = false
      pageData.isHome = false
      pageData.isLoad = true
      break
  }
}

function getEnvironmentDisplay(environment: string) {
  if (environment === "internal-qa") {
    return "Integration (Preview)"
  } else if (environment === "int") {
    return "Integration"
  } else if (environment === "internal-dev") {
    return "Development"
  } else if (environment.endsWith("-sandbox")) {
    return "Sandbox"
  } else {
    return environment
  }
}

function getPayloads() {
  const isCustom = pageData.selectedExampleId === "custom"
  const filePayloads = pageData.payloads
  const textPayloads = [(document.getElementById("prescription-textarea") as HTMLTextAreaElement).value]
  try {
    const payloads = filePayloads
      .concat(textPayloads)
      .filter(Boolean)
      .map(payload => JSON.parse(payload))
    return isCustom
      ? payloads
      : [
        pageData.examples.filter(function (example) {
          return example.id === pageData.selectedExampleId
        })[0].messageFn(pageData.baseUrl)
      ]
  } catch (e) {
    console.log("Unable to parse custom prescription(s)")
  }
}

async function parseMetadataResponse(): Promise<Array<SoftwareVersion>> {
  const metadataResponse: MetadataResponse = await makeRequest(
    "GET",
    `${pageData.baseUrl}metadata`
  )

  const softwareVersions: Array<SoftwareVersion> = []

  const software = metadataResponse.capabilityStatement.software[0]
  const epsPackage = {name: software.name, version: software.version}

  softwareVersions.push(epsPackage)

  const apiDefinitionExtension = getExtensionForUrl(
    metadataResponse.capabilityStatement.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-NHSDigital-APIDefinition"
  )
  const packageExtensions = getExtensionsForUrl(apiDefinitionExtension.extension, "implementationGuide")
  packageExtensions.forEach(packageExtension => {
    const packageName = getExtensionForUrl(packageExtension.extension, "name").valueString
    const packageVersion = getExtensionForUrl(packageExtension.extension, "version").valueString
    softwareVersions.push({name: packageName, version: packageVersion})
  })

  return softwareVersions
}

function getExtensionsForUrl<T extends Extension>(extensions: Array<T>, url: string) {
  return extensions.filter(extension => extension.url === url)
}

function getExtensionForUrl<T extends Extension>(extensions: Array<T>, url: string) {
  const matchingExtensions = getExtensionsForUrl<T>(extensions, url)
  if (matchingExtensions.length === 1) {
    return matchingExtensions[0]
  } else {
    console.log("Failed to parse FHIR message")
  }
}
