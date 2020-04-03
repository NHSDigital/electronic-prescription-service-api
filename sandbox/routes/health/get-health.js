module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'GET',
    path: '/Health',
    handler: (request, h) => {
      return h.response("EPS is alive")
    }
  }
]
