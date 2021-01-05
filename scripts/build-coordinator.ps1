npm run --prefix=coordinator/ build
cp coordinator/package.json coordinator/dist/
mkdir -Force coordinator/dist/resources
cp coordinator/src/resources/ebxml_request.mustache coordinator/dist/resources/