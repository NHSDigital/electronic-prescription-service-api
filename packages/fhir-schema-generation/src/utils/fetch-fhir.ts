import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { FhirPackageVersion, FhirPackageMetadata } from '../fhir/fhir-package-metadata.js'

async function queryPackageVersion(registry: string, name: string, version: string | undefined): Promise<FhirPackageVersion> {
    const metaResponse = await fetch(`${registry}/${name}`);
    if (!metaResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metaResponse.statusText}`);
    }

    const metadata: FhirPackageMetadata = await metaResponse.json();
    const targetVersion: string | undefined = version === 'latest' ? metadata['dist-tags'].latest : version;

    if (targetVersion == null) {
        throw new Error(`Cannot find valid version in metadata`)
    }
    else if (!metadata.versions[targetVersion]) {
        throw new Error(`Version ${targetVersion} not found in registry.`);
    }
    else if (version != metadata['dist-tags'].latest) {
        console.warn("A later version of this package is available", metadata['dist-tags'].latest);
    }

    return metadata.versions[targetVersion]
}


async function downloadTarballPackage(url: string, target: string): Promise<any> {
    console.log(`Downloading: ${url}...`);

    const tarballResponse: Response = await fetch(url);
    if (!tarballResponse.ok || !tarballResponse.body) {
        throw new Error(`Failed to download tarball: ${tarballResponse.statusText}`);
    }

    const stream = fs.createWriteStream(target);
    await finished(Readable.fromWeb(tarballResponse.body as any).pipe(stream));
}


export async function extractAndReadPackage(source: string, target: string): Promise<any | null> {
    console.log(`Extracting: ${source} to ${target}...`);

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    await tar.x({
        file: source,
        cwd: target,
    });
    console.log(`Extraction complete.`);

    const packageDirPath = path.join(target, 'package');
    const packageJsonPath = path.join(packageDirPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
        const fileContent = fs.readFileSync(packageJsonPath, 'utf-8');
        const packageManifest = JSON.parse(fileContent);
        console.log(`Read extracted package info. Name: ${packageManifest.name}, Version: ${packageManifest.version}`);

        return packageManifest;
    } else {
        console.warn(`Could not find expected 'package/package.json' inside ${target}`);
    }

    return null;
}

export async function downloadSimplifierPackage(registry: string, name: string, version?: string | "latest"): Promise<any | null> {
    // Check simplifier to fetch latest version or check if specified version is latest
    const metadata = await queryPackageVersion(registry, name, version);

    const targetDir = `${name.replace(/\//g, '-')}-${version}`
    const targetPath = `${targetDir}.tgz`;
    const outputDir = path.join(process.cwd(), '.output', 'raw')
    const outputFile = path.join(outputDir, targetPath)

    if (!fs.existsSync(outputDir)) {
        console.log(`Creating directory "${outputDir}"`)
        fs.mkdirSync(outputDir, { recursive: true });
    }
    else if (fs.existsSync(targetPath)) {
        console.log(`File "${targetPath}" already exists locally. Skipping download.`);
        return;
    }

    console.log(`Downloading ${name}:${metadata.version} from ${registry}`)
    const tarballPath: string | null = metadata.dist.tarball ?? metadata.url

    if (tarballPath == null || tarballPath.trim().length == 0) {
        throw new Error(`Failed to find valid URL for Tarball`)
    }

    await downloadTarballPackage(tarballPath, outputFile)

    const extractDir = path.join(process.cwd(), ".output", "parsed", targetDir);
    return await extractAndReadPackage(outputFile, extractDir);
}