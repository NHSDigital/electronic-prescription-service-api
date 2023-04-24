import {getSHA256PrepareEnabled} from "../../../../src/utils/feature-flags"

export enum HashingAlgorithm {
  SHA1,
  SHA256
}

export function getPrepareHashingAlgorithmFromEnvVar(): HashingAlgorithm {
  return getSHA256PrepareEnabled() ? HashingAlgorithm.SHA256 : HashingAlgorithm.SHA1
}

export function getHashingAlgorithmFromAlgorithmIdentifier(algorithmIdentifier: AlgorithmIdentifier): HashingAlgorithm {
  switch (algorithmIdentifier) {
    case "http://www.w3.org/2000/09/xmldsig#rsa-sha1":
      return HashingAlgorithm.SHA1
    case "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256":
      return HashingAlgorithm.SHA256
  }
}
