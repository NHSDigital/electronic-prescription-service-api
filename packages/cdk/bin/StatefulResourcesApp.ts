#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import {StatefulResourcesStack} from "../stacks/StatefulResourcesStack"
import {Aspects, Tags} from "aws-cdk-lib"
import {AwsSolutionsChecks} from "cdk-nag"
import {addCfnGuardMetadata} from "./utils/appUtils"

const app = new cdk.App()

const stackName = app.node.tryGetContext("statefulResourcesStackName")
const version = app.node.tryGetContext("VERSION_NUMBER")
const commit = app.node.tryGetContext("commitId")
const accountId = app.node.tryGetContext("accountId")
const cfnDriftDetectionGroup = app.node.tryGetContext("cfnDriftDetectionGroup")

// add cdk-nag to everything
Aspects.of(app).add(new AwsSolutionsChecks({verbose: true}))

Tags.of(app).add("accountId", accountId)
Tags.of(app).add("stackName", stackName)
Tags.of(app).add("version", version)
Tags.of(app).add("commit", commit)
Tags.of(app).add("cdkApp", "prescriptions")
Tags.of(app).add("repo", "electronic-prescription-service-api")
Tags.of(app).add("cfnDriftDetectionGroup", cfnDriftDetectionGroup)

const StatefulResources = new StatefulResourcesStack(app, "stateful-resources", {
  env: {
    region: "eu-west-2",
    account: accountId
  },
  stackName: stackName
})

addCfnGuardMetadata(StatefulResources, "Custom::S3AutoDeleteObjectsCustomResourceProvider", "Handler")
