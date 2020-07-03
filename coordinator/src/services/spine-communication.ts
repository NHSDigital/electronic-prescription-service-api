import axios from "axios"
import https from "https"

export interface SpineResponse {
    body: string
    statusCode: number
}

const httpsAgent = new https.Agent({
    cert: process.env.CLIENT_CERT,
    key: process.env.CLIENT_KEY,
});

async function request(message = '') {
    const result = await axios.post(
        'veit07.devspineservices.nhs.uk',
        message,
        {httpsAgent}
    )
    return {body: result.data, statusCode: result.status}
}

export function sendData(message: string): Promise<SpineResponse> {
    return (
        process.env.SANDBOX === "1" ?
        Promise.resolve({body: "sandbox city", statusCode: 202}) :
        request(message)
    )
}
