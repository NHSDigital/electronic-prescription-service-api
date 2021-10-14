import Hapi from "@hapi/hapi"

export default [
  {
    method: "POST",
    path: "/prescribe/sign",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      // todo: non-mocked implementation
      const useMockPrepareResponses = process.env.ENVIRONMENT?.endsWith("-sandbox")
      if (useMockPrepareResponses) {
        const prescriptionIds = request.yar.get("prescription_ids")
        prescriptionIds.forEach((id: string) => {
          request.yar.set(`prepare_response_${id}`, {
            // eslint-disable-next-line max-len
            digest: "PFNpZ25lZEluZm8geG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjxDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L0Nhbm9uaWNhbGl6YXRpb25NZXRob2Q+PFNpZ25hdHVyZU1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNyc2Etc2hhMSI+PC9TaWduYXR1cmVNZXRob2Q+PFJlZmVyZW5jZT48VHJhbnNmb3Jtcz48VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L1RyYW5zZm9ybT48L1RyYW5zZm9ybXM+PERpZ2VzdE1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNzaGExIj48L0RpZ2VzdE1ldGhvZD48RGlnZXN0VmFsdWU+Q2VwU0dqM3JoZm93MmdDUHlSUHdMVkVnejZNPTwvRGlnZXN0VmFsdWU+PC9SZWZlcmVuY2U+PC9TaWduZWRJbmZvPg==",
            algorithm: "RS1",
            timestamp: "2021-05-07T14:47:58+00:00"
          })
        })
      }
      return h.response({}).code(200)
    }
  }
]
