
Example code used to generate an XML-DSig:

    ```  
      function toXmlSignature(digest: string, signature: string, certificate: string): string {
        const decodedDigest = Buffer.from(digest, "base64").toString("utf-8")
        const digestWithoutNamespace = decodedDigest.replace("<SignedInfo xmlns=\"http://www.w3.org/2000/09/xmldsig#\">", "<SignedInfo>")
        const xmlSignature = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${digestWithoutNamespace}<SignatureValue>${signature}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certificate}</X509Certificate></X509Data></KeyInfo></Signature>`
        return Buffer.from(xmlSignature, "utf-8").toString("base64")
      }
    ```