#!/usr/bin/env bash
set -e

if [ -z "${REPOSITORY_NAME}" ]; then
  echo "REPOSITORY_NAME not set"
  exit 1
fi

if [ -z "${IMAGE_TAG}" ]; then
  echo "IMAGE_TAG not set"
  exit 1
fi

function wait_for_scan() {
  echo "Giving some time for scan to begin..."
  sleep 3
  while [[ $(aws ecr describe-image-scan-findings --repository-name "${REPOSITORY_NAME}" --image-id imageTag="${IMAGE_TAG}" | jq -r .imageScanStatus.status) != "COMPLETE" ]];do 
    echo "SCAN IS NOT YET COMPLETE..."
    sleep 3
  done
}

function check_for_high_critical_vuln() {
  scan_results=$(aws ecr describe-image-scan-findings --repository-name "${REPOSITORY_NAME}" --image-id imageTag="${IMAGE_TAG}")
  high=$(echo "$scan_results" | jq '.imageScanFindings.enhancedFindings[]? | select(.severity == "HIGH" and .status != "SUPPRESSED")')
  critical=$(echo "$scan_results" | jq '.imageScanFindings.enhancedFindings[]? | select(.severity == "CRITICAL" and .status != "SUPPRESSED")')
}

function return_scan_results() {
    echo "=== BEGIN IMAGE SCAN RESULTS ==="
    echo "$scan_results"
    echo "=== END IMAGE SCAN RESULTS ==="
}

function return_error() {
    echo -e "\n**********************************************************"
    echo "**********************************************************"
    echo "**********************************************************"
    echo "ERROR: There are CRITICAL/HIGH vulnerabilities. Stopping build."
    echo "**********************************************************"
    echo "**********************************************************"
    echo "**********************************************************"
    exit 2
}

function analyze_scan_results() {
  if [[ -n "$critical" ]]; then
    echo "ERROR: There are CRITICAL vulnerabilities. Stopping build."

    echo "=== BEGIN CRITICAL IMAGE SCAN RESULTS ==="
    echo "$critical"
    echo "=== END CRITICAL IMAGE SCAN RESULTS ==="

    return_scan_results

    return_error
  elif [[ -n "$high" ]]; then
    echo "ERROR: There are HIGH vulnerabilities. Stopping build."

    echo "=== BEGIN HIGH IMAGE SCAN RESULTS ==="
    echo "$high"
    echo "=== END HIGH IMAGE SCAN RESULTS ==="

    return_scan_results
    return_error
  else
    return_scan_results
  fi
}

wait_for_scan
check_for_high_critical_vuln
analyze_scan_results
