export interface FhirPackageVersion {
  name: string;
  version: string;
  description: string;
  fhirVersion: string;
  url: string;
  dist: Record<string, string>;
}
