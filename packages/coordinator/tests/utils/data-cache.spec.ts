import pino from "pino"
import {DataCache} from "../../src/utils/data-cache"

type TestData = string
const testData = "MockCacheData"

const fetchMockData = (): Promise<TestData> => {
  return Promise.resolve(testData)
}

const MSG_CACHE_HIT = "Cache hit"
const MSG_CACHE_EXPIRED = "Cache expired- fetching fresh data"

describe("DataCache", () => {
  let dataCache: DataCache<TestData>
  let logger: pino.Logger
  let loggerSpy: jest.SpyInstance

  beforeAll(() => {
    logger = pino()
    dataCache = new DataCache(fetchMockData, 1, logger)
  })

  beforeEach(() => {
    loggerSpy = jest.spyOn(logger, "debug")
  })

  afterEach(() => {
    loggerSpy.mockReset()
  })

  test("can fetch fresh data", async () => {
    const data = await dataCache.getData()
    expect(data).toBe(testData)
    expect(loggerSpy).toHaveBeenCalledWith(MSG_CACHE_EXPIRED)
  })

  test("can retrieve cached data", async () => {
    const first = await dataCache.getData()
    expect(first).toBe(testData)

    const second = await dataCache.getData()
    expect(second).toBe(testData)

    expect(loggerSpy).toHaveBeenCalledWith(MSG_CACHE_HIT)
  })

  test("when TTL expires, it fetches fresh data", async () => {
    const first = await dataCache.getData()
    dataCache.resetCache()
    const second = await dataCache.getData()
    
    expect(first).toBe(testData)
    expect(first).toBe(second)
    expect(loggerSpy).toHaveBeenLastCalledWith(MSG_CACHE_EXPIRED)
  })
})
