
def get_prescription_id(bundle_json):
    for entry in bundle_json['entry']:
        resource = entry["resource"]
        if resource["resourceType"] == "MedicationRequest":
            return resource["groupIdentifier"]["value"]


def create_provenance(timestamp, signature):
    # todo: handle references/identifiers
    return {
      "fullUrl": "urn:uuid:28828c55-8fa7-42d7-916f-fcf076e0c10e",
      "resource": {
        "resourceType": "Provenance",
        "id": "28828c55-8fa7-42d7-916f-fcf076e0c10e",
        "target": [
          {
            "reference": "urn:uuid:a54219b8-f741-4c47-b662-e4f8dfa49ab6"
          }
        ],
        "recorded": "2021-02-11T16:35:38+00:00",
        "agent": [
          {
            "who": {
              "reference": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"
            }
          }
        ],
        "signature": [
          {
            "type": [
              {
                "system": "urn:iso-astm:E1762-95:2013",
                "code": "1.2.840.10065.1.12.1.1"
              }
            ],
            "when": timestamp,
            "who": {
              "reference": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"
            },
            "data": signature
          }
        ]
      }
    }
