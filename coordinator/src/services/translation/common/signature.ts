import * as crypto from "crypto-js"

export type DigestAlgorithm = "SHA1" | "SHA256"
export type SigningAlgorithm = "RS1" | "RS256"
export type SignatureVerificationAlgorithm = "RSA-SHA1" | "RSA-SHA256"

export function getDigestAlgorithm(digestAlgorithm: string): DigestAlgorithm {
  switch (digestAlgorithm) {
    case "SHA1":
      return "SHA1"
    case "SHA256":
      return "SHA256"
    default:
      throw new Error(`Digest hashing algorithm '${digestAlgorithm}' not supported`)
  }
}

export function getSigningAlgorithm(signingAlgorithm: string): SigningAlgorithm {
  switch (signingAlgorithm) {
    case "RS1":
      return "RS1"
    case "SHA256":
      return "RS256"
    default:
      throw new Error(`Signing algorithm '${signingAlgorithm}' not supported`)
  }
}

export function getXmlDSigDigestMethodAlgorithm(digestAlgorithm: DigestAlgorithm): string {
  return digestAlgorithm.toLowerCase()
}

export function getXmlDSigSignatureMethodAlgorithm(signingAlgorithm: SigningAlgorithm): string {
  switch (signingAlgorithm) {
    case "RS1":
      return "rsa-sha1"
    case "RS256":
      return "rsa-sha256"
  }
}

export function createDigest(fragmentsToBeHashed: string, digestAlgorithm: DigestAlgorithm): string {
  switch (digestAlgorithm) {
    case "SHA1":
      return crypto.SHA1(fragmentsToBeHashed).toString(crypto.enc.Base64)
    case "SHA256":
      return crypto.SHA256(fragmentsToBeHashed).toString(crypto.enc.Base64)
    default:
      throw new Error(`Digest hashing algorithm '${digestAlgorithm}' is not supported`)
  }
}

export function getSignatureVerificationAlgorithm(
  signingAlgorithm: SigningAlgorithm
): SignatureVerificationAlgorithm {
  switch (signingAlgorithm) {
    case "RS1":
      return "RSA-SHA1"
    case "RS256":
      return "RSA-SHA256"
    default:
      throw new Error(
        `No signature verification algorithm supported for signing algorithm '${signingAlgorithm}'`
      )
  }
}
