cd validator/src/main/resources
Remove-Item -Force -ErrorAction ignore ./*.pkg
Remove-Item -Force -ErrorAction ignore packages.txt
Get-Content -Raw ./manifest.json | jq -r '.[] | (\"https://packages.simplifier.net/\" + .packageName)' | Out-File -FilePath ./packages.txt
foreach($line in Get-Content ./packages.txt) {
    $version=(curl "$line" | Select Content -Expand Content | jq -r '.[\"dist-tags\"].latest')
    $filename=($line -replace "https://packages.simplifier.net/", "" -replace "\.", "-")
    curl -o "./$filename.pkg" "$line/$version"
}
Remove-Item -Force -ErrorAction ignore packages.txt
cd ../../..
mvn clean package
cd ..
