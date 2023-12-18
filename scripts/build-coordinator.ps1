./scripts/set_env_vars.ps1
npm run --prefix=coordinator/ build
cp coordinator/package.json coordinator/dist/
mkdir -Force coordinator/dist/coordinator/src/resources
cp coordinator/src/resources/ebxml_request.mustache coordinator/dist/coordinator/src/resources/
cp coordinator/src/resources/get_prescription_document_request.mustache coordinator/dist/coordinator/src/resources/
cp coordinator/src/resources/get_prescription_metadata_request.mustache coordinator/dist/coordinator/src/resources/
