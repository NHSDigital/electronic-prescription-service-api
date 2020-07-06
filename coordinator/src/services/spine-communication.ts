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
});

async function request(message = '') {
    const wrappedMessage = addEbXmlWrapper(message)
    const result = await axios.post(
        'https://veit07.devspineservices.nhs.uk',
        wrappedMessage,
        {httpsAgent,
        headers: {"Content-Type": "multipart/related; boundary=\"--=_MIME-Boundary\"; type=text/xml; start=ebXMLHeader@spine.nhs.uk"}
        }
    )
    return {body: result.data, statusCode: result.status}
}

export function sendData(message: string): Promise<SpineResponse> {
    return (
        process.env.SANDBOX === "1" ?
        Promise.resolve({body: "Message Sent", statusCode: 200}) :
        request(message)
    )
}
