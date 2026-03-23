import * as fs from "node:fs"
import * as path from "node:path"
import * as tar from "tar"
import {Readable} from "node:stream"
import {finished} from "node:stream/promises"
import {FhirPackageVersion, FhirPackageMetadata} from "../models/fhir/fhir-package-metadata.js"

/** * Queries the package registry to validate if a specific target version exists and returns its metadata.
 * If "latest" is provided as the version, it resolves and returns the most recent version.
 * Logs a warning if the requested version is older than the latest available version.
 *
 * @param {string} registry - The base URL of the package registry.
 * @param {string} name - The name of the package to query.
 * @param {string | undefined} version - The specific version to fetch, or "latest".
 * @returns {Promise<FhirPackageVersion>} A promise that resolves to the metadata of the requested package version.
 * @throws {Error} If the metadata cannot be fetched, or if the specified version does not exist.
 */
async function queryPackageVersion(
  registry: string,
  name: string,
  version: string | undefined): Promise<FhirPackageVersion> {
  const metaResponse = await fetch(`${registry}/${name}`)
  if (!metaResponse.ok) {
    throw new Error(`Failed to fetch metadata: ${metaResponse.statusText}`)
  }

  const metadata: FhirPackageMetadata = await metaResponse.json()
  const targetVersion: string | undefined = version === "latest" ? metadata["dist-tags"].latest : version

  if (targetVersion === null || targetVersion === undefined) {
    throw new Error(`Cannot find valid version in metadata`)
  } else if (!metadata.versions[targetVersion]) {
    throw new Error(`Version ${targetVersion} not found in registry.`)
  } else if (version !== metadata["dist-tags"].latest) {
    console.warn("A later version of this package is available", metadata["dist-tags"].latest)
  }

  return metadata.versions[targetVersion]
}

/**
 * Downloads a tarball file from a given URL and streams it to a local file system path.
 *
 * @param {string} url - The direct URL to the tarball file.
 * @param {string} target - The local file path where the tarball should be saved.
 * @returns {Promise<any>} A promise that resolves when the file has finished downloading and writing to disk.
 * @throws {Error} If the HTTP request fails or the response body is empty.
 */
async function downloadTarballPackage(url: string, target: string): Promise<void> {
  console.log(`Downloading: ${url}...`)

  const tarballResponse: Response = await fetch(url)
  if (!tarballResponse.ok || !tarballResponse.body) {
    throw new Error(`Failed to download tarball: ${tarballResponse.statusText}`)
  }

  const stream = fs.createWriteStream(target)

  await finished(Readable.fromWeb(tarballResponse.body as any).pipe(stream))
}

/**
 * Extracts a locally saved tarball into a specified directory and reads its package manifest.
 * It expects the tarball to contain a 'package' directory with a 'package.json' file inside.
 *
 * @param {string} source - The local file path of the tarball to extract.
 * @param {string} target - The directory path where the tarball contents should be extracted.
 * @returns {Promise<any | null>} A promise resolving to the parsed package.json
 * manifest object, or null if the manifest is missing.
 */
export async function extractAndReadPackage(source: string, target: string): Promise<unknown> {
  console.log(`Extracting: ${source} to ${target}...`)

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, {recursive: true})
  }

  const resolvedTarget = path.resolve(target)
  await tar.x({
    file: source,
    cwd: target,
    // zip-slip validation: only allow entries that resolve within the target directory
    filter: (entryPath: string) => {
      const resolvedEntry = path.resolve(resolvedTarget, entryPath)
      return resolvedEntry.startsWith(resolvedTarget + path.sep) || resolvedEntry === resolvedTarget
    }
  })
  console.log(`Extraction complete.`)

  const packageDirPath = path.join(target, "package")
  const packageJsonPath = path.join(packageDirPath, "package.json")

  if (fs.existsSync(packageJsonPath)) {
    const fileContent = fs.readFileSync(packageJsonPath, "utf-8")
    const packageManifest = JSON.parse(fileContent)
    console.log(`Read extracted package info. Name: ${packageManifest.name}, Version: ${packageManifest.version}`)

    return packageManifest
  } else {
    throw new Error(`Could not find expected 'package/package.json' inside ${target}`)
  }

}

/**
 * Orchestrates the full process of fetching, downloading, and extracting a FHIR package from a registry.
 * It resolves the requested version, downloads the tarball to a raw output directory (skipping if already cached),
 * and extracts the contents into a parsed output directory.
 *
 * @param {string} registry - The base URL of the package registry (e.g., Simplifier).
 * @param {string} name - The name of the package to download.
 * @param {string | "latest"} [version] - The specific version of the package to download, or "latest".
 * @returns {Promise<any | null>} A promise resolving to the extracted package manifest, or null if it fails
 *  to read the extracted manifest.
 * @throws {Error} If a valid tarball URL cannot be found in the registry metadata.
 */
export async function downloadSimplifierPackage(
  registry: string,
  name: string,
  version?: string
): Promise<unknown> {

  // Check simplifier to fetch latest version or check if specified version is latest
  const metadata = await queryPackageVersion(registry, name, version)

  const targetDir = `${name.replaceAll("/", "-")}-${version}`
  const targetPath = `${targetDir}.tgz`
  const outputDir = path.join(process.cwd(), ".output", "raw")
  const outputFile = path.join(outputDir, targetPath)

  if (!fs.existsSync(outputDir)) {
    console.log(`Creating directory "${outputDir}"`)
    fs.mkdirSync(outputDir, {recursive: true})
  } else if (fs.existsSync(outputFile)) {
    console.log(`File "${targetPath}" already exists locally. Skipping download.`)
    return
  }

  console.log(`Downloading ${name}:${metadata.version} from ${registry}`)
  const tarballPath: string | null = metadata.dist.tarball ?? metadata.url

  if (tarballPath == null || tarballPath.trim().length === 0) {
    throw new Error(`Failed to find valid URL for Tarball`)
  }

  await downloadTarballPackage(tarballPath, outputFile)

  const extractDir = path.join(process.cwd(), ".output", "parsed", targetDir)
  return await extractAndReadPackage(outputFile, extractDir)
}
