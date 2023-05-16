import {Req}  from '../src/configs/spec'
import {getSignatureTemplate} from "../util/templates"
import base64url from "base64url"
import crypto from "crypto"
import fs from "fs"
const url = process.env.base_url;

const privateKey = process.env.private_key
export function getJWT(digest) {
  let hea = {
    "alg": "RS512",
    "typ": "JWT",
    "kid": "test-1"
  };

  let pload = {
    "payloads": [
      {
        "id": "1",
        "payload": digest
      }
    ],
    "algorithm": "RS1",
    "iat": Math.floor(new Date().getTime() / 1000) - 600, // Issued 10 mins ago
    "exp": Math.floor(new Date().getTime() / 1000) + 600, // Expires in 10 minutes
    //"aud": `${url}/signing-service`,
    "aud": `${url}/oauth2/token`,
     "iss": process.env.client_id,
     "sub": process.env.client_id
  };

  let token = base64url(JSON.stringify(hea)) + "." + base64url(JSON.stringify(pload));
  return token
}

export function getSignedSignature(digests, valid){
  const b64SignData = new Map()
  for (let [key, value] of digests) {
    const digest = Buffer.from(value[0], "base64").toString("utf-8")
    const digestWithoutNamespace = digest.replace(
        `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">`,
        `<SignedInfo>`
    )
    const signedSignature = crypto
        .sign("sha1", Buffer.from(digest, "utf-8"), {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        })
        .toString("base64")
    const certificate = fs.readFileSync("./keymaterial/SELF_SIGNED_certificate.pem", "utf-8")
    const x509 = new crypto.X509Certificate(certificate)
    if (new Date(x509.validTo).getTime() < new Date().getTime()) {
      throw new Error("Signing certificate has expired")
    }
    const certificateValue = x509.raw.toString("base64")
    let signData = getSignatureTemplate();
    signData = signData.replace("{{digest}}", digestWithoutNamespace)
    if (valid) {
      signData = signData.replace("{{signature}}", signedSignature)
    } else {
      signData = signData.replace("{{signature}}", `${signedSignature}TVV3WERxSU0xV0w4ODdRRTZ3O`)
    }
    signData = signData.replace("{{cert}}", certificateValue)
    b64SignData.set(key, Buffer.from(signData, "utf-8").toString('base64'))
  }
  return b64SignData
}


export async function getSignature(jwt, accessToken){

  let resp;
  resp = await Req().adhocPost1(`${url}/signing-service/signaturerequest`, jwt, {
    post: {
      'Accept': 'application/json',
      'Content-Type': 'text/plain',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  let token = resp.data.token
  let redirectUri = resp.data.redirectUri
  console.log ( token + ".....)))))))))))))))" + '\n' + redirectUri+"&mock=true")

  //resp = await Req().adhocGet(`${redirectUri}&mock=true`, "");
  // console.log ( ".....)))))))))))))))" + '\n' + resp.data)

  // resp = await Req().adhocGet(`${url}/signing-service/signatureresponse/${token}`, {
  //   headers: {
  //     //'Accept': 'application/json',
  //     'Authorization': `Bearer ${accessToken}`
  //   }
  // });
  // const id = resp.data.id
  // const signature = resp.data.signature
  // console.log (id + "....." + signature)

return resp.data

}
