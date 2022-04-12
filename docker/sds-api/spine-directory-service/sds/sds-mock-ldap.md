## SDS - Spine Route Lookup component - Mock LDAP

SDS component has a built in LDAP mocking capability configurable via environment variables:

- `SDS_MOCK_LDAP_RESPONSE` - turns the behaviour on and off (`"True"` / `"False"`)
- `SDS_MOCK_LDAP_MODE` - indicates how to retrieve data from mock json files. One of: FIRST, RANDOM, STRICT (default)
- `SDS_MOCK_LDAP_PAUSE` - [optional] value in milliseconds that determines how long the mock code should wait before returning a fake response

# Mock data

When mock response is enabled, service will use predefined response for every request.
Fake data is defined at
`./sds/lookup/mock_data/sds_mhs_response.json`
`./sds/lookup/mock_data/sds_as_response.json`

# Simulating slow LDAP response

When mock response is enabled, it is possible to simulate long LDAP response using the `SDS_MOCK_LDAP_PAUSE` environment variable
If value is not present, the default 0 seconds will be used - immediate response
