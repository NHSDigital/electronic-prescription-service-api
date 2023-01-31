import axios from "axios";

let url = process.env.base_url;

const instance = axios.create({
  baseURL: url,
  headers: {
    "NHSD-Session-URID": "555254242106",
    "X-Request-ID": "60E0B220-8136-4CA5-AE46-1D97EF59D068",
    "X-Correlation-ID": "11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA",
    "Content-Type": "application/fhir+json",
    "Accept": "application/fhir+json"
  }
});

//instance.defaults.headers.post['Content-Type'] = "application/fhir+json"

instance.interceptors.request.use(request => {
  console.log('Starting Request 4444 ..............................', JSON.stringify(request, null, 2))
  return request;
})

instance.interceptors.response.use(response => {
  return response;
}, error => {
  console.log(`Status code ${error.response.status} : Message - ${error.response.statusText}`)
  console.log(error.response.data)
  return Promise.reject(error);
});

export default instance;
