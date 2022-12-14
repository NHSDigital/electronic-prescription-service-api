import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"

export function createJWT(apiKey: string, audience: string, privateKey: string, keyId?: string): string {
  return jsonwebtoken.sign(
    {},
    privateKey,
    {
      algorithm: "RS512",
      issuer: apiKey,
      subject: apiKey,
      audience: audience,
      keyid: keyId || "test-1",
      expiresIn: 300,
      jwtid: uuid.v4()
    }
  )
}
