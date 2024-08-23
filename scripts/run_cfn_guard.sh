#!/usr/bin/env bash
set -eou pipefail

rm -rf /tmp/ruleset
rm -rf cfn_guard_output

wget -O /tmp/ruleset.zip https://github.com/aws-cloudformation/aws-guard-rules-registry/releases/download/1.0.2/ruleset-build-v1.0.2.zip  >/dev/null 2>&1
unzip /tmp/ruleset.zip -d /tmp/ruleset/  >/dev/null 2>&1 

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/aws-cloudformation/cloudformation-guard/main/install-guard.sh | sh >/dev/null 2>&1

mkdir -p cfn_guard_output

declare -a rulesets=("ncsc" "ncsc-cafv3" "wa-Reliability-Pillar" "wa-Security-Pillar")
for ruleset in "${rulesets[@]}"
    do

    while IFS= read -r -d '' file
    do
        echo "checking SAM template $file with ruleset $ruleset"
        mkdir -p "$(dirname cfn_guard_output/"$file")"

        # transform the SAM template to cloudformation and then run through cfn-guard
        SAM_OUPUT=$(sam validate -t "$file" --region eu-west-2 --debug 2>&1 | \
            grep -Pazo '(?s)AWSTemplateFormatVersion.*\n\/' | tr -d '\0')
        echo "${SAM_OUPUT::-1}" | ~/.guard/bin/cfn-guard validate \
            --rules "/tmp/ruleset/output/$ruleset.guard" \
            --show-summary fail \
            > "cfn_guard_output/${file}_${ruleset}.txt"

    done <   <(find ./SAMtemplates -name '*.y*ml' -print0)

done

rm -rf /tmp/ruleset
