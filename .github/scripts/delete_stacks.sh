#!/usr/bin/env bash

# generic script for removing cloudformation stacks and old CNAME records where the pull request is closed

# the name of the repo this is running in
REPO_NAME=electronic-prescription-service-api

# regex used in jq command that parses the output from aws cloudformation list-stacks and just captures stacks we are interested in
CAPTURE_REGEX="^prescribe-dispense-pr-(\\d+)(-sandbox)?$"

# regex that is used to get the pull request id from the cloud formation stack name
# this is used in a replace command to replace the stack name so what is left is just the pull request id
PULL_REQUEST_STACK_REGEX=prescribe-dispense-pr-

# this should be a query to get old CNAME records to delete
CNAME_QUERY=prescribe-dispense-pr-

should_delete_resources_for_pr() {
  PR_RESPONSE=$1

  STATE=$(echo "${PR_RESPONSE}" | jq -r '.state // empty')
  AUTHOR=$(echo "${PR_RESPONSE}" | jq -r '.user.login // empty')
  AUTO_MERGE_ENABLED=$(echo "${PR_RESPONSE}" | jq -r '.auto_merge != null')

  if [ "${STATE}" == "closed" ]; then
    DELETE_REASON="state is closed"
    return 0
  fi

  if [ "${STATE}" == "open" ] && [ "${AUTHOR}" == "dependabot[bot]" ] && [ "${AUTO_MERGE_ENABLED}" != "true" ]; then
    DELETE_REASON="dependabot PR is open but not in merge queue"
    return 0
  fi

  return 1
}

main() {
  delete_cloudformation_stacks
  delete_cname_records
}

delete_cloudformation_stacks() {
  echo "checking cloudformation stacks"
  echo
  ACTIVE_STACKS=$(aws cloudformation list-stacks | jq -r --arg CAPTURE_REGEX "${CAPTURE_REGEX}" '.StackSummaries[] | select ( .StackStatus != "DELETE_COMPLETE" ) | select( .StackName | capture($CAPTURE_REGEX) ) | .StackName ')

  mapfile -t ACTIVE_STACKS_ARRAY <<< "$ACTIVE_STACKS"

  for i in "${ACTIVE_STACKS_ARRAY[@]}"
  do
    echo "Checking if stack $i has open pull request"
    PULL_REQUEST=${i//${PULL_REQUEST_STACK_REGEX}/}
    PULL_REQUEST=${PULL_REQUEST//-sandbox/}
    echo "Checking pull request id ${PULL_REQUEST}"
    URL="https://api.github.com/repos/NHSDigital/${REPO_NAME}/pulls/${PULL_REQUEST}"
    RESPONSE=$(curl --header "authorization: Bearer ${GITHUB_TOKEN}" "${URL}" 2>/dev/null)
    if should_delete_resources_for_pr "${RESPONSE}"; then
      echo "** going to delete stack $i as ${DELETE_REASON} **"
      aws cloudformation delete-stack --stack-name "${i}"
      echo "** Sleeping for 60 seconds to avoid 429 on delete stack **"
      sleep 60
    else
      STATE=$(echo "${RESPONSE}" | jq -r '.state // "unknown"')
      AUTHOR=$(echo "${RESPONSE}" | jq -r '.user.login // "unknown"')
      AUTO_MERGE_ENABLED=$(echo "${RESPONSE}" | jq -r '.auto_merge != null')
      echo "not going to delete stack $i as state=${STATE}, author=${AUTHOR}, auto_merge_enabled=${AUTO_MERGE_ENABLED}"
    fi
  done
}

delete_cname_records() {
  HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name dev.eps.national.nhs.uk. | jq -r ".HostedZones[0] | .Id")
  CNAME_RECORDS=$(aws route53 list-resource-record-sets --hosted-zone-id "${HOSTED_ZONE_ID}" \
    --query "ResourceRecordSets[?Type == 'CNAME' && contains(Name, '${CNAME_QUERY}')]" \
    | jq -r " .[] | .Name")

  mapfile -t CNAME_RECORDS_ARRAY <<< "$CNAME_RECORDS"

  for i in "${CNAME_RECORDS_ARRAY[@]}"
  do
    echo "Checking if CNAME record $i has open pull request"

    PULL_REQUEST=$(echo "$i" | grep -Po '(?<=-pr-)\d+')
    echo "Checking pull request id ${PULL_REQUEST}"
    URL="https://api.github.com/repos/NHSDigital/${REPO_NAME}/pulls/${PULL_REQUEST}"
    RESPONSE=$(curl --url "${URL}" --header "Authorization: Bearer ${GITHUB_TOKEN}" 2>/dev/null)
    if should_delete_resources_for_pr "${RESPONSE}"; then
      echo "** going to delete CNAME record $i as ${DELETE_REASON} **"
      record_set=$(aws route53 list-resource-record-sets --hosted-zone-id "${HOSTED_ZONE_ID}" \
        --query "ResourceRecordSets[?Name == '$i']" --output json | jq .[0])

      jq -n --argjson record_set "${record_set}" \
          '{Changes: [{Action: "DELETE", ResourceRecordSet: $record_set}]}' > /tmp/payload.json

      aws route53 change-resource-record-sets --hosted-zone-id "${HOSTED_ZONE_ID}" --change-batch file:///tmp/payload.json

      echo "CNAME record $i deleted"
      else
        STATE=$(echo "${RESPONSE}" | jq -r '.state // "unknown"')
        AUTHOR=$(echo "${RESPONSE}" | jq -r '.user.login // "unknown"')
        AUTO_MERGE_ENABLED=$(echo "${RESPONSE}" | jq -r '.auto_merge != null')
        echo "not going to delete CNAME record $i as state=${STATE}, author=${AUTHOR}, auto_merge_enabled=${AUTO_MERGE_ENABLED}"
      fi
  done
}

main
