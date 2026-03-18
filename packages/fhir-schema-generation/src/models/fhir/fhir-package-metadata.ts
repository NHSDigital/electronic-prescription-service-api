export interface FhirPackageMetadata {
    _id: string;
    name: string;
    description: string;
    versions: Record<string, FhirPackageVersion>;
    "dist-tags": DistTags;
}

export interface DistTags {
    latest: string;
    [key: string]: string;
}

export interface FhirPackageVersion {
    name: string;
    version: string;
    description: string;
    fhirVersion: string;
    url: string;
    dist: Record<string, string>;
}
