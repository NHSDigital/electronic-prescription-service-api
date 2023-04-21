import * as crypto from "crypto-js"

type Encoder = typeof crypto.enc.Base64
export function createHash(thingsToHash: string, useSHA256?: boolean, encoder?: Encoder): string {
  return useSHA256 ? crypto.SHA256(thingsToHash).toString(encoder) : crypto.SHA1(thingsToHash).toString(encoder)
}
