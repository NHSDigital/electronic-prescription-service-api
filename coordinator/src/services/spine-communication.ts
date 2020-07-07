import axios from "axios"
import https from "https"
import {addEbXmlWrapper} from "./request-builder";

export interface SpineResponse {
    body: string
    statusCode: number
}

const httpsAgent = new https.Agent({
    cert: process.env.CLIENT_CERT,
    key: process.env.CLIENT_KEY,
    ca: [
        process.env.ROOT_CA_CERT,
        process.env.SUB_CA_CERT
    ]
});

async function request(message = '') {
    const wrappedMessage = addEbXmlWrapper(message).replace(/\n/g, "\r\n")
    try{
        const result = await axios.post(
            'https://veit07.devspineservices.nhs.uk/reliablemessaging/reliablerequest',
        wrappedMessage,
        {
            httpsAgent,
            headers: {
                "Content-Type": "multipart/related; boundary=\"--=_MIME-Boundary\"; type=text/xml; start=ebXMLHeader@spine.nhs.uk",
                "SOAPAction": "urn:nhs:names:services:mm/PORX_IN020101UK31"
            }
        },
        )
        return {body: result.data, statusCode: result.status}
    }catch(error) {
        if (error.response) {
            return {body: error.response.data, statusCode: error.response.status}
        } else if (error.request) {
            return {body: error.request.data, statusCode: 408}
        } else {
            return {body: error.message.data, statusCode: 500}
        }
    }
}

export function sendData(message: string): Promise<SpineResponse> {
    return (
        process.env.SANDBOX === "1" ?
            Promise.resolve({body: "Message Sent", statusCode: 200}) :
            request(message)
    )
}
