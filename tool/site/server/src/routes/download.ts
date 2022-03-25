import Hapi from "@hapi/hapi"
import exportFromJSON from "export-from-json"
import {getSessionValueOrDefault} from "../services/session"

export default [
  {
    method: "GET",
    path: "/download/test-exception-report",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const testExceptions = getSessionValueOrDefault("test-exceptions", request, {TEST: "1"})
      const fileName = "test-exception-report.xlsx"
      const result = exportFromJSON({
        data: testExceptions,
        fileName: fileName,
        processor (content) {
          return content
        }
      })
      return h.response(result)
        .bytes(result.length)
        .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("content-disposition", `attachment; filename=${fileName}.xlsx;`)
        .encoding("binary")
        .code(200)
    }
  }
]
