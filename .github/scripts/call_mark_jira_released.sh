#!/usr/bin/env bash

echo "calling mark jira released"

cat <<EOF > payload.json
{ 
  "releaseVersion": "FHIR-$RELEASE_TAG"
}
EOF
cat payload.json

function_arn=$(aws cloudformation list-exports --query "Exports[?Name=='release-notes:MarkJiraReleasedLambdaArn'].Value" --output text)
aws lambda invoke --function-name "${function_arn}" --cli-binary-format raw-in-base64-out --payload file://payload.json out.txt
cat out.txt
