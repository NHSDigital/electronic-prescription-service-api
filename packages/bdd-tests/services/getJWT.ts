import {Req}  from '../src/configs/spec'
import {get_SignatureTemplate} from "../util/templates"
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
    "aud": `${url}/signing-service`,
     "iss": process.env.client_id,
     "sub": process.env.client_id
  };

  //let token = base64url(JSON.stringify(hea)) + "." + base64url(JSON.stringify(pload));
  let token = base64url(JSON.stringify(hea)) + "." + base64url(JSON.stringify(pload)) + "." + "Nonsense";
  return token
}

export function getSignedSignature(digests, valid){
  const b64SignData = new Map()
  for (let [key, value] of digests) {
    const digestString =Buffer.from(value, 'base64').toString()
    //const key = keyFileContent.replace(/(?<=(.*\n.*))\n(?=.*\n)/g, "")
    // @ts-ignore
    let signedSignature = crypto.sign("RSA-SHA1", digestString, privateKey).toString("base64")
    let signData = get_SignatureTemplate();
    signData = signData.replace("{{digest}}", digestString)
    if (valid) {
      signData = signData.replace("{{signature}}", signedSignature)
    } else {
      signData = signData.replace("{{signature}}", `${signedSignature}TVV3WERxSU0xV0w4ODdRRTZ3O`)
    }
    let certContent = fs.readFileSync("./keymaterial/SELF_SIGNED_certificate.pem.bare", 'utf8');
    // @ts-ignore
    signData = signData.replace("{{cert}}", certContent.replaceAll('\n', ""))
    //console.log(signData)
    b64SignData.set(key, Buffer.from(signData).toString('base64'))
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
