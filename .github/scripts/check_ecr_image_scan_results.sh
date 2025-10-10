#!/usr/bin/env bash
set -e

AWS_MAX_ATTEMPTS=20
export AWS_MAX_ATTEMPTS

if [ -z "${REPOSITORY_NAME}" ]; then
  echo "REPOSITORY_NAME not set"
  exit 1
fi

if [ -z "${IMAGE_TAG}" ]; then
  echo "IMAGE_TAG not set"
  exit 1
fi

if [ -z "${AWS_REGION}" ]; then
  echo "AWS_REGION not set"
  exit 1
fi

if [ -z "${ACCOUNT_ID}" ]; then
  echo "AWS_REGION not set"
  exit 1
fi

IMAGE_DIGEST=$(aws ecr describe-images \
  --repository-name "$REPOSITORY_NAME" \
  --image-ids imageTag="$IMAGE_TAG" \
  --query 'imageDetails[0].imageDigest' \
  --output text)

RESOURCE_ARN="arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${REPOSITORY_NAME}/${IMAGE_DIGEST}"

echo "Monitoring scan for ${REPOSITORY_NAME}:${IMAGE_TAG}"
echo "Resource ARN: ${RESOURCE_ARN}"
echo

# Wait for ECR scan to reach COMPLETE
STATUS=""
echo "Waiting for ECR scan to complete..."
for i in {1..30}; do
  echo "Checking scan status. Attempt ${i}"
  STATUS=$(aws ecr describe-image-scan-findings \
    --repository-name "$REPOSITORY_NAME" \
    --image-id imageDigest="$IMAGE_DIGEST" \
    --query 'imageScanStatus.status' \
    --output text 2>/dev/null || echo "NONE")

  if [[ "$STATUS" == "COMPLETE" ]]; then
    echo "ECR scan completed."
    break
  fi

  if [[ "$STATUS" == "FAILED" ]]; then
    echo "Scan failed."
    exit 1
  fi

  echo "SCAN IS NOT YET COMPLETE. Waiting 10 seconds before checking again..."
  sleep 10
done

if [[ "$STATUS" != "COMPLETE" ]]; then
  echo "Timeout waiting for ECR scan to complete."
  exit 1
fi

# Wait for Inspector2 findings to appear & stabilize
# this is in place as scan may show as complete but findings have not yet stabilize
echo
echo "Waiting for Inspector2 findings to stabilize..."

PREV_HASH=""
for i in {1..12}; do  # ~2 minutes max
  FINDINGS=$(aws inspector2 list-findings \
    --filter-criteria "{
      \"resourceId\": [{\"comparison\": \"EQUALS\", \"value\": \"${RESOURCE_ARN}\"}],
      \"findingStatus\": [{\"comparison\": \"EQUALS\", \"value\": \"ACTIVE\"}]
    }" \
    --output json 2>/dev/null || echo "{}")

  CURR_HASH=$(echo "$FINDINGS" | sha256sum)
  COUNT=$(echo "$FINDINGS" | jq '.findings | length')

  if [[ "$COUNT" -gt 0 && "$CURR_HASH" == "$PREV_HASH" ]]; then
    echo "Findings stabilized ($COUNT findings)."
    break
  fi

  PREV_HASH="$CURR_HASH"
  echo "Attempt: ${i}. Still waiting... (${COUNT} findings so far)"
  sleep 10
done

# Extract counts and display findings
echo
echo "Final Inspector2 findings with suppressions removed:"
echo

echo "$FINDINGS" | jq '{
  findings: [
    .findings[]? | {
      severity: .severity,
      title: .title,
      package: .packageVulnerabilityDetails.vulnerablePackages[0].name,
      sourceUrl: .packageVulnerabilityDetails.sourceUrl,
      recommendation: (.remediation.recommendation.text // "N/A")
    }
  ]
}'

echo

# Check for critical/high severity
CRITICAL_COUNT=$(echo "$FINDINGS" | jq '[.findings[]? | select(.severity=="CRITICAL")] | length')
HIGH_COUNT=$(echo "$FINDINGS" | jq '[.findings[]? | select(.severity=="HIGH")] | length')

if (( CRITICAL_COUNT > 0 || HIGH_COUNT > 0 )); then
  echo "${CRITICAL_COUNT} CRITICAL and ${HIGH_COUNT} HIGH vulnerabilities detected!"
  echo
  echo "Critical/High vulnerabilities:"
  echo "$FINDINGS" | jq -r '
    .findings[]? |
    select(.severity=="CRITICAL" or .severity=="HIGH") |{
      severity: .severity,
      title: .title,
      package: .packageVulnerabilityDetails.vulnerablePackages[0].name,
      sourceUrl: .packageVulnerabilityDetails.sourceUrl,
      recommendation: (.remediation.recommendation.text // "N/A")
    }'
  echo
  echo "Failing pipeline due to Critical/High vulnerabilities."
  exit 2
else
  echo "No Critical or High vulnerabilities found."
  exit 0
fi
