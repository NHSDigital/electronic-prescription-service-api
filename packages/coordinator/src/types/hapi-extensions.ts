import "@hapi/hapi"

declare module "@hapi/hapi" {
  interface RequestApplicationState {
    parsedPayload?: unknown
  }
}
