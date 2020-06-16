const parser = require("../services/request-body-parser")

test('it should return an empty requestBody object when given a null request payload', () => {
  expect(parser.parse({ payload: null}))
      .toEqual({})
})