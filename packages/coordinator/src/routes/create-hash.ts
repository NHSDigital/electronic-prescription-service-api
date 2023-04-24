import * as crypto from "crypto-js"
import {HashingAlgorithm} from "../../src/services/translation/common/hashingAlgorithm"

type Encoder = typeof crypto.enc.Base64
export function createHash(thingsToHash: string, hashingAlgorithm: HashingAlgorithm, encoder?: Encoder): string {
  switch (hashingAlgorithm) {
    case HashingAlgorithm.SHA1:
      return crypto.SHA1(thingsToHash).toString(encoder)
    case HashingAlgorithm.SHA256:
      return crypto.SHA256(thingsToHash).toString(encoder)
  }
}
