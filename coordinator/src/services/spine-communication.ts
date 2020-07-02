import https from "https"

const options = {
    hostname: 'httpbin.org',
    path: '/anything',
    method: 'GET',
    key: process.env.CLIENT_KEY,
    cert: process.env.CLIENT_CERT,
    agent: false
};

const sandboxOptions = {
    hostname: 'httpbin.org',
    path: '/anything',
    method: 'POST'
};

async function request(urlOptions: requestOptions, data = '') {
    return await new Promise((resolve, reject) => {
        const req = https.request(urlOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk.toString()));
            res.on('error', reject);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode <= 299) {
                    resolve(body);
                } else {
                    reject('Request failed. status: ' + res.statusCode + ', body: ' + body);
                }
            });
        });
        req.on('error', reject);
        req.write(data, 'binary');
        req.end();
    }).then(result => {return result})
}

export function sendData(message: string): string {
    if (process.env.SANDBOX === "1") {
        request(sandboxOptions, message).then(function(result) {console.log(result)})
        return message
    }
    request(options).then(function(result) {console.log(result)})
    return "bluh"
}

class requestOptions {
    hostname?: string
    path?: string
    method?: string
    key?: string
    cert?: string
    agent?: boolean
}
