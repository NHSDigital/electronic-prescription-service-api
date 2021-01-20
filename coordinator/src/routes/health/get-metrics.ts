import Hapi from "@hapi/hapi"
import * as osu from "node-os-utils"

export default [
  {
    method: "GET",
    path: "/_metrics",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      return h.response({
        cpuUsage: await osu.cpu.usage(),
        memoryInfo: await osu.mem.info(),
        netInfo: await osu.netstat.stats(),
        commitId: process.env.COMMIT_ID
      })
    }
  }
]
