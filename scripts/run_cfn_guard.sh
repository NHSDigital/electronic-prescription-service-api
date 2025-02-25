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
    echo "Checking all templates in cdk.out folder with ruleest $ruleset"

    ~/.guard/bin/cfn-guard validate \
        --data cdk.out \
        --rules "/tmp/ruleset/output/$ruleset.guard" \
        --show-summary fail \
        > "cfn_guard_output/cdk.out_$ruleset.txt"

done

rm -rf /tmp/ruleset
