import https from "https"

const options = {
    hostname: 'veit07.devspineservices.nhs.uk',
    method: 'POST',
    key: process.env.CLIENT_KEY,
    cert: process.env.CLIENT_CERT,
    agent: false
};

async function request(urlOptions: requestOptions, data = '') {
    return new Promise((resolve, reject) => {
        const req = https.request(urlOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk.toString()));
            res.on('error', reject);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode <= 299) {
                    resolve({body: body, statusCode: res.statusCode});
                } else {
                    reject('Request failed. status: ' + res.statusCode + ', body: ' + body);
                }
            });
        });
        req.on('error', reject);
        req.write(data, 'binary');
        req.end();
    })
}

export function sendData(message: string): Promise<unknown> {
    if (process.env.SANDBOX === "1") {
        return new Promise<unknown>((resolve) => {resolve({body: "bluh", statusCode: 202})})
        // return request(sandboxOptions, message).then(function(result) {return result})
    }
    return request(options, message).then(function(result) {return result})
}

class requestOptions {
    hostname?: string
    path?: string
    method?: string
    key?: string
    cert?: string
    agent?: boolean
}
