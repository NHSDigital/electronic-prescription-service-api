import {spine} from "@models"
import pino from "pino"
import {StatusCheckResponse} from "../../utils/status"
import {LiveSpineClient} from "./live-spine-client"
import {SandboxSpineClient} from "./sandbox-spine-client"
// import {config as dotenvConfig} from "dotenv"

export interface SpineClient {
  send(request: spine.ClientRequest, logger: pino.Logger): Promise<spine.SpineResponse<unknown>>
  poll(path: string, fromAsid: string, logger: pino.Logger): Promise<spine.SpineResponse<unknown>>
  getStatus(logger: pino.Logger): Promise<StatusCheckResponse>
}

function getSpineClient(liveMode: boolean): SpineClient {
  return liveMode
    ? new LiveSpineClient()
    : new SandboxSpineClient()
}

export const spineClient = getSpineClient(process.env.SANDBOX !== "1")

// dotenvConfig()

// interface SpineClientConfig {
//   privateKeyArn: string
//   publicCertificateArn: string
//   caChainArn: string
// }

// export const spineClientConfig: SpineClientConfig = {
//   privateKeyArn: process.env.SpinePrivateKeyARN || "",
//   publicCertificateArn: process.env.SpinePublicCertificateARN || "",
//   caChainArn: process.env.SpineCAChainARN || ""
// }

// if (!spineClientConfig.privateKeyArn || !spineClientConfig.publicCertificateArn || !spineClientConfig.caChainArn) {
//   console.error("Error: SpineClient configuration variables are missing. Ensure all environment variables are set.")
//   throw new Error("SpineClient configuration variables missing.")
// }

// console.log("Spine Client Configuration:")
// console.log(`Private Key ARN: ${spineClientConfig.privateKeyArn}`)
// console.log(`Public Certificate ARN: ${spineClientConfig.publicCertificateArn}`)
// console.log(`CA Chain ARN: ${spineClientConfig.caChainArn}`)
