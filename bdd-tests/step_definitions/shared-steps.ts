import { getToken } from "../services/getaccessToken";
import instance from "../src/configs/api";

export const givenIAmAuthenticated = (given) => {
  given('I am authenticated', async() => {
    const token = await getToken(process.env.userId1)
    console.log(token)
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  });
};
