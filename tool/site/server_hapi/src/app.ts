import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import {promisify} from "util"
import {exec} from "child_process"

const executeChildProcess = promisify(exec)

async function logOpenPorts() {
  console.log("lsof results:")
  await executeChildProcessAndLogOutput("lsof -i -P -n")
  console.log("netstat results:")
  await executeChildProcessAndLogOutput("netstat -a -p")
}

async function executeChildProcessAndLogOutput(command: string) {
  const {stdout, stderr} = await executeChildProcess(command)
  console.log("stdout:", stdout)
  console.log("stderr:", stderr)
}

const init = async () => {
  const server = Hapi.server({
    port: 9001,
    host: "0.0.0.0",
    routes: {
      cors: true, // Won't run as Apigee hosted target without this
      payload: {
        parse: false
      }
    }
  })

  server.route(routes)

  await server.register({
    plugin: HapiPino,
    options: {
      // Dont pretty print to avoid spamming logs
      prettyPrint: false,
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ["req.headers.authorization"]
    }
  })

  console.log("About to start server")
  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)
  await logOpenPorts()
}

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

logOpenPorts().then(init)
