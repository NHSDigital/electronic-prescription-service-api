import {fetcher} from "@models"
import {convert} from "../convert"

beforeAll(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2022, 1, 1))
})

afterAll(() => {
  jest.useRealTimers()
})

const allExpectedPassingConvertExamples = fetcher.convertExamples.filter(e => e.isSuccess)
test.skip.each(allExpectedPassingConvertExamples)(
  "regenerate convert snapshots",
  async (convertCase) => {
    const request = convertCase.request
    const convertResponse = await convert(request)
    convertCase.rewriteResponseFile(convertResponse.message)
  }
)
