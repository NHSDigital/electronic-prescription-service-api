import {Construct} from "constructs"

import {IRole, ManagedPolicy} from "aws-cdk-lib/aws-iam"
import {IKey} from "aws-cdk-lib/aws-kms"
import {RemovalPolicy} from "aws-cdk-lib"
import {
  CfnLogGroup,
  FilterPattern,
  ILogGroup,
  LogGroup,
  SubscriptionFilter
} from "aws-cdk-lib/aws-logs"
import {KinesisDestination} from "aws-cdk-lib/aws-logs-destinations"
import {IStream} from "aws-cdk-lib/aws-kinesis"

export interface LogGroupProps {
  readonly stackName: string
  readonly cloudWatchLogsKmsKey: IKey
  readonly logRetentionInDays: number
  readonly splunkDeliveryStream: IStream
  readonly splunkSubscriptionFilterRole: IRole
}

/**
 * Log groups
 */

export class LogGroups extends Construct {
  public readonly coordinatorLogGroup: ILogGroup
  public readonly validatorLogGroup: ILogGroup

  public constructor(scope: Construct, id: string, props: LogGroupProps) {
    super(scope, id)

    // Resources

    // kms key for the table
    const coordinatorLogGroup = new LogGroup(this, "CoordinatorLogGroup", {
      encryptionKey: props.cloudWatchLogsKmsKey,
      logGroupName: `/aws/ecs/${props.stackName!}-coordinator`,
      retention: props.logRetentionInDays,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const cfnCoordinatorLogGroup = coordinatorLogGroup.node.defaultChild as CfnLogGroup
    cfnCoordinatorLogGroup.cfnOptions.metadata = {
      guard: {
        SuppressedRules: [
          "CW_LOGGROUP_RETENTION_PERIOD_CHECK"
        ]
      }
    }

    new SubscriptionFilter(this, "CoordinatorSplunkSubscriptionFilter", {
      logGroup: coordinatorLogGroup,
      filterPattern: FilterPattern.allTerms(),
      destination: new KinesisDestination(props.splunkDeliveryStream, {
        role: props.splunkSubscriptionFilterRole
      })
    })

    const validatorLogGroup = new LogGroup(this, "ValidatorLogGroup", {
      encryptionKey: props.cloudWatchLogsKmsKey,
      logGroupName: `/aws/ecs/${props.stackName!}-validator`,
      retention: props.logRetentionInDays,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const cfnValidatorLogGroup = validatorLogGroup.node.defaultChild as CfnLogGroup
    cfnValidatorLogGroup.cfnOptions.metadata = {
      guard: {
        SuppressedRules: [
          "CW_LOGGROUP_RETENTION_PERIOD_CHECK"
        ]
      }
    }

    new SubscriptionFilter(this, "ValidatorSplunkSubscriptionFilter", {
      logGroup: validatorLogGroup,
      filterPattern: FilterPattern.allTerms(),
      destination: new KinesisDestination(props.splunkDeliveryStream, {
        role: props.splunkSubscriptionFilterRole
      })
    })
    // Outputs
    this.coordinatorLogGroup = coordinatorLogGroup
    this.validatorLogGroup = validatorLogGroup
  }
}
