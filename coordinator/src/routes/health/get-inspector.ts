import Hapi from "@hapi/hapi"
import * as inspector from "inspector"
import {Profiler} from "inspector"
import {sleep} from "../util"
import {gzipSync} from "zlib"

async function runCpuProfiler(durationMillis: number) {
  return await withInspectorSession(async session => {
    await enableProfiler(session)
    await startProfiler(session)
    console.log("CPU profile start")
    await sleep(durationMillis)
    console.log("CPU profile end")
    const stopResponse = await stopProfiler(session)
    await disableProfiler(session)
    return stopResponse.profile
  })
}

// async function heapDump() {
//   return await withInspectorSession(async session => {
//     await enableHeapProfiler(session)
//
//     const chunks: Array<string> = []
//     session.addListener("HeapProfiler.addHeapSnapshotChunk", message => {
//       chunks.push(message.params.chunk)
//     })
//
//     console.log("Heap dump start")
//     await takeHeapSnapshot(session)
//     console.log("Heap dump end")
//
//     await disableHeapProfiler(session)
//
//     console.log("Waiting for compression")
//     const result = chunks.map(c => gzipSync(c))
//
//     console.log(`Returning compressed data`)
//     return Buffer.concat(result).toString("base64")
//   })
// }

async function withInspectorSession<T>(fn: (session: inspector.Session) => Promise<T>) {
  const session = new inspector.Session()
  try {
    session.connect()
    return await fn(session)
  } finally {
    session.disconnect()
  }
}

function enableProfiler(session: inspector.Session) {
  return new Promise<void>((resolve, reject) => {
    return session.post("Profiler.enable", (e) => e ? reject(e) : resolve())
  })
}

function disableProfiler(session: inspector.Session) {
  return new Promise<void>((resolve, reject) => {
    return session.post("Profiler.disable", (e) => e ? reject(e) : resolve())
  })
}

function startProfiler(session: inspector.Session) {
  return new Promise<void>((resolve, reject) => {
    return session.post("Profiler.start", (e) => e ? reject(e) : resolve())
  })
}

function stopProfiler(session: inspector.Session) {
  return new Promise<Profiler.StopReturnType>((resolve, reject) => {
    return session.post("Profiler.stop", (e, v) => e ? reject(e) : resolve(v))
  })
}

// function enableHeapProfiler(session: inspector.Session) {
//   return new Promise<void>((resolve, reject) => {
//     return session.post("HeapProfiler.enable", (e) => e ? reject(e) : resolve())
//   })
// }
//
// function disableHeapProfiler(session: inspector.Session) {
//   return new Promise<void>((resolve, reject) => {
//     return session.post("HeapProfiler.disable", (e) => e ? reject(e) : resolve())
//   })
// }
//
// function takeHeapSnapshot(session: inspector.Session) {
//   return new Promise<void>((resolve, reject) => {
//     return session.post("HeapProfiler.takeHeapSnapshot", (e) => e ? reject(e) : resolve())
//   })
// }

export default [
  {
    method: "GET",
    path: "/_cpuProfile",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const durationStr = request.headers["duration"]
      const duration = durationStr ? parseInt(durationStr) : 30000
      const profile = await runCpuProfiler(duration)
      const profileStr = JSON.stringify(profile)
      const compressedCpuProfile = gzipSync(profileStr).toString("base64")
      return h.response(compressedCpuProfile)
    }
  }
  // {
  //   method: "GET",
  //   path: "/_heapDump",
  //   handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
  //     const compressedHeapDump = await heapDump()
  //     return h.response(compressedHeapDump)
  //   }
  // }
]
