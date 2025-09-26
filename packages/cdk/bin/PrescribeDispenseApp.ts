#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import {PrescribeDispenseStack} from "../stacks/PrescribeDispenseStack"
import {Aspects, Tags} from "aws-cdk-lib"
import {AwsSolutionsChecks} from "cdk-nag"

const app = new cdk.App()

const serviceName = app.node.tryGetContext("serviceName")
const version = app.node.tryGetContext("VERSION_NUMBER")
const commit = app.node.tryGetContext("commitId")
const accountId = app.node.tryGetContext("accountId")
const cfnDriftDetectionGroup = app.node.tryGetContext("cfnDriftDetectionGroup")

// add cdk-nag to everything
Aspects.of(app).add(new AwsSolutionsChecks({verbose: true}))

Tags.of(app).add("accountId", accountId)
Tags.of(app).add("serviceName", serviceName)
Tags.of(app).add("version", version)
Tags.of(app).add("commit", commit)
Tags.of(app).add("cdkApp", "prescribe-dispense")
Tags.of(app).add("repo", "electronic-prescription-service-clinical-prescription-tracker")
Tags.of(app).add("cfnDriftDetectionGroup", cfnDriftDetectionGroup)

new PrescribeDispenseStack(app, "prescribe-dispense", {
  env: {
    region: "eu-west-2",
    account: accountId
  },
  serviceName: serviceName,
  stackName: serviceName,
  version: version
})
