import pino from "pino"

type FetchFunction<T> = () => Promise<T>

/**
 * DataCache allows to cache data in memory, optionally specifying a TTL.
 * 
 * Original JS source: https://www.mojotech.com/blog/node-js-memory-cache/
 */
class DataCache<T> {
  private cache: T
  private fetchDate: Date
  private readonly millisecondsToLive: number
  private readonly fetchFunction: FetchFunction<T>
  private readonly logger: pino.Logger

  constructor(fetchFunction: FetchFunction<T>, minutesToLive: number, logger: pino.Logger) {
    this.cache = null
    this.millisecondsToLive = minutesToLive * 60 * 1000
    this.fetchFunction = fetchFunction
    this.fetchDate = new Date(0)
    this.logger = logger
  }

  isCacheExpired(): boolean {
    return (this.fetchDate.getTime() + this.millisecondsToLive) < new Date().getTime()
  }

  getData(): Promise<T> {
    if (!this.cache || this.isCacheExpired()) {
      this.logger.debug("Cache expired- fetching fresh data")

      return this.fetchFunction()
        .then((data: T) => {
          this.cache = data
          this.fetchDate = new Date()
          return data
        })
    } else {
      this.logger.debug("Cache hit")
      return Promise.resolve(this.cache)
    }
  }

  resetCache(): void {
    this.cache = null
    this.fetchDate = new Date(0)
  }
}

export {DataCache}
