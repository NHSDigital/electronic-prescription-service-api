import {Req}  from '../src/configs/spec'
const base64url = require("base64url");
//let crypto = require("crypto");
const keyFileContent = require("fs").readFileSync("./keymaterial/privateKey.key", 'utf8');
const url = process.env.base_url;
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
    "aud": "https://internal-qa.api.service.nhs.uk/signing-service",
     // "iss": "qvP9NoQcOVqKrXEdtLv8B0j7p5VmjPDd",
     // "sub": "qvP9NoQcOVqKrXEdtLv8B0j7p5VmjPDd",
     // "iss": "J1FMsDsYP3hFeOOziI0csLf3EOf3jSkM",
     // "sub": "J1FMsDsYP3hFeOOziI0csLf3EOf3jSkM"
    "iss": "9AfEOqUltvbzj8YKXPZmN1ZfwaCRo4hs",
    "sub": "9AfEOqUltvbzj8YKXPZmN1ZfwaCRo4hs"
  };

  let token = base64url(JSON.stringify(hea)) + "." + base64url(JSON.stringify(pload));
  //let token = base64url(JSON.stringify(hea)) + "." + base64url(JSON.stringify(pload)) + "." + "Nonsense";

  let signatureAlg = require("crypto").createSign("SHA-512");
  // let signatureAlg = require("crypto").createSign("RSA-SHA1");
  signatureAlg.update(token);
  let signature = signatureAlg.sign(keyFileContent);
  signature = base64url(signature);
  let signedToken = token + "." + signature;
  //
  // console.log("=================signed JWT =================" + '\n' + signedToken);
  //
  return signedToken
  //return token
}

export async function getSignature(jwt, accessToken){

  let resp;
  let d = "youus"
  console.log("=============" + typeof d)
  console.log("=============__+++" +typeof jwt)

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
