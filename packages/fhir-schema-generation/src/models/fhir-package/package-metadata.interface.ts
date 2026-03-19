import {DistTags as DistTags} from "./dist-tags.interface.js"
import {FhirPackageVersion} from "./package-version.interface"

export interface PackageMetadata {
    _id: string;
    name: string;
    description: string;
    versions: Record<string, FhirPackageVersion>;
    "dist-tags": DistTags;
}
