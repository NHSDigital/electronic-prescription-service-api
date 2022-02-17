import {fetcher} from "@models"
import {convert} from "services/translation/convert.successes.spec"

const allExpectedPassingConvertExamples = fetcher.convertExamples.filter(e => e.isSuccess)
test.skip.each(allExpectedPassingConvertExamples)(
  "regenerate convert snapshots",
  async (convertCase) => {
    const request = convertCase.request
    const convertResponse = await convert(request)
    convertCase.rewriteResponseFile(convertResponse.message)
  }
)
