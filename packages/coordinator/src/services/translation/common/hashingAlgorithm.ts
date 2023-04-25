import {ElementCompact} from "xml-js"
import {getSHA256PrepareEnabled} from "../../../../src/utils/feature-flags"

export enum HashingAlgorithm {
  SHA1,
  SHA256
}

export function getPrepareHashingAlgorithmFromEnvVar(): HashingAlgorithm {
  return getSHA256PrepareEnabled() ? HashingAlgorithm.SHA256 : HashingAlgorithm.SHA1
}

export function getHashingAlgorithmFromSignatureRoot(signatureRoot: ElementCompact): HashingAlgorithm {
  const digestHashingAlgorithm = signatureRoot.Signature.SignedInfo.Reference.DigestMethod._attributes.Algorithm
  switch (digestHashingAlgorithm) {
    case "http://www.w3.org/2001/04/xmlenc#sha256":
      return HashingAlgorithm.SHA256
    case "http://www.w3.org/2000/09/xmldsig#sha1":
    default:
      return HashingAlgorithm.SHA1
  }
}
