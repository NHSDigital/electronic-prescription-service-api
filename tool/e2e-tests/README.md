# Electronic Prescription Service API Tool - E2E Tests

## Development

Set the following environment variables to be able to run selenium tests through firefox locally:

```
$env:LOCAL_MODE="true"
$env:FIREFOX_BINARY_PATH="<path_to_firefox_binary_including_binary>"
```

Optional config:

```
$env:SERVICE_BASE_PATH="<service_base_path>" # defaults to 'eps-api-tool'
```

To run:

```
npm ci
npm t
```

Tested on Firefox Version 96.0.3
