import Hapi from "@hapi/hapi";

export function parse(request: Hapi.Request): unknown {
    return request.payload || {}
}
