// import * as fs from "fs"
// import path from "path"
// es-lint-disable-next-line max-len
// import { VALID_APIGEE_ENVIRONMENTS, getAuthForm, AuthClient, parseAuthForm, sendAuthForm, getAxiosInstance}
//from "../src/oauth"

// // Mock out all top level functions, such as get, put, delete and post:
// // jest.mock("axios")

// describe("AuthClient tests", () => {
//   const client = new AuthClient()
//   const OLD_ENV = process.env

//   beforeEach(() => {
//     jest.resetModules() // Most important - it clears the cache
//     process.env = { ...OLD_ENV } // Make a copy
//   })

//   afterEach(() => {
//     process.env = OLD_ENV // Restore old environment
//   })

//   test.each([...VALID_APIGEE_ENVIRONMENTS])("got %s environment", (apigeeEnv: string) => {
//     process.env.APIGEE_ENVIRONMENT = apigeeEnv
//     const env = client.getEnvironment()
//     expect(env).toBe(apigeeEnv)
//   })
// })

// describe("when the auth form is fetched", () => {
//   let htmlPage: string

//   beforeAll(() => {
//     htmlPage = fs.readFileSync(path.join(__dirname, "./authorize.html"), "utf-8")
//   })

//   test("inputs are parsed corrected", async () => {
//     const formData = parseAuthForm(htmlPage)
//     expect(formData.action).not.toBeFalsy()
//     // expect(formData.data).toMatchObject({
//     //   username: "555086689106",
//     //   login: "Sign In"
//     // })
//   })
// })

// describe("auth flow", async () => {
//   test("can get a token", async () => {

//     const client = new AuthClient()
//     const axiosInstance = getAxiosInstance(client)

//     const authForm = await getAuthForm(axiosInstance, client.getAuthUrl(), client.getAuthParams())
//     const authFormData = await parseAuthForm(authForm.data)
//     const authFormResponse = await sendAuthForm(axiosInstance, authFormData)

//     expect(authFormResponse).not.toBeFalsy()
//   })
// })

test("stub", () => {
  expect(true).toBeTruthy()
})
