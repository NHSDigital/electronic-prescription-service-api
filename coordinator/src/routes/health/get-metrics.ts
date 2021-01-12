import Hapi from "@hapi/hapi"
import * as osu from "node-os-utils"

export default [
  {
    method: "GET",
    path: "/_metrics",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const cpu = osu.cpu
      const cpuUsage = await cpu.usage()

      const memory = osu.mem
      const memoryInfo = await memory.info()

      const netStat = osu.netstat
      const netInfo = await netStat.stats()

      return h.response({
        cpuUsage,
        memoryInfo,
        netInfo,
        commitId: process.env.COMMIT_ID
      })
    }
  }
]
