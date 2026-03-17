import { downloadSimplifierPackage } from './utils/fetch-fhir.js';

async function main() {
    try {
        console.log('Starting application initialization...');

        const registryUrl: string = `https://packages.simplifier.net`;
        const packageName: string = 'hl7.fhir.r4.core';
        const version = 'latest';

        const simplifierPackage = await downloadSimplifierPackage(registryUrl, packageName, version);
    } catch (error) {
        console.error('Application failed to start:', error);
        process.exit(1);
    }
}

// Execute the entry point
main();