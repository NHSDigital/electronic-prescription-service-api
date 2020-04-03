module.exports = {
  verifyResourceTypeIsBundle: function(request) {
    return request.payload && request.payload["resourceType"] && request.payload["resourceType"] === "Bundle"
  },

  verifyBundleContainsEntries: function(request) {
    return request.payload && request.payload["entry"]
  },

  verifyBundleEntryContainsMedicationRequest: function(request) {
    return request.payload["entry"].filter(entry => entry["resourceType"] === "MedicationRequest").length !== 0
  },

  verifyBundleEntryContainsOnePatient: function(request) {
    return request.payload["entry"].filter(entry => entry["resourceType"] === "Patient").length === 1
  },

  verifyBundleEntryContainsPractitioner: function(request) {
    return request.payload["entry"].filter(entry => entry["resourceType"] === "Practitioner").length !== 0
  },

  verifyBundleEntryContainsOneEncounter: function(request) {
    return request.payload["entry"].filter(entry => entry["resourceType"] === "Encounter").length === 1
  },

  verifyBundleEntryContainsTwoOrganizations: function(request) {
    return request.payload["entry"].filter(entry => entry["resourceType"] === "Organization").length === 2
  }
}
