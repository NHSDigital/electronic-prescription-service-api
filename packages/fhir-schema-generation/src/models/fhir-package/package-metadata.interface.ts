import {DistTags as DistTags} from "./dist-tags.interface.js"
import type {FhirPackageVersion} from "./package-version.interface.js"

export interface PackageMetadata {
    _id: string;
    name: string;
    description: string;
    versions: Record<string, FhirPackageVersion>;
    "dist-tags": DistTags;
}
