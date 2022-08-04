import {Plugin, Server} from "@hapi/hapi"
import pino from "pino"

declare module "@hapi/hapi" {
    interface Server {
        logger: pino.Logger;
    }

    interface Request {
        logger: pino.Logger;
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PluginOptions {}

export const plugin: Plugin<PluginOptions> = {
  pkg: "eps-logger",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register: async function (server: Server, options: PluginOptions) {
    server.decorate("request", "logger", function() {
      return pino()
    })
  }
}
