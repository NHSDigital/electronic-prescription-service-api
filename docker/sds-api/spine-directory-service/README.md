# SDS API

This package contains a pre-assured implementation of a Spine Directory Service (SDS), intended to encapsulate the details of Spine routing and reliability messaging and provide a simple HTTP FHIR interface.

## Introduction - What is an SDS?

The NHS Spine is "a collection of national applications, services and directories which support the health and social care sector in the
exchange of information in national and local IT systems. A national, central service that underpins the NHS Care Records Service".
It provides applications such as the Personal Demographics Service (PDS) and also supports intermediary communication between other systems
(such as the transfer of patient records between GP practices when a patient moves practice).

## Software Architecture

The following diagram provides a view of the services (run in docker containers) and Python modules which make up the SDS Adaptor:

<!-- TODO change link -->
[SDS Adaptor Logical Architecture](../documentation/MHSLogicalArchitecture.pdf)

These services have some dependencies, shown in blue, which are implemented through the adaptor pattern:
- Container orchestration. The container orchestration solution of your choice can be used. In this repository, Docker compose is used when running
the adaptor locally, and ECS, Fargate and ECR are used by the AWS exemplar architecture.
- Secret Store - Used to safely inject secrets such as passwords into running containers.
- Logs Store - Running containers log to STDOUT and therefore logs can be captured and forwarded to the logging solution of your choice.
- Load Balancers are shown balancing load to the Inbound and outbound services. The AWS exemplar demonstrates the use of Application Load Balancers and
Network Load Balancers to implement this.
- Directory cache which acts as a cache for frequently requested routing and reliability information. This has been implemented using Apigee Edge as response cache.

The National Adaptors Common Module provides classes which implement common requirements leveraged by multiple services or modules. -->

## API Documentation

Please refer to the [API Documentation](spine-directory-service-api.yaml) for further details.

Examples of how this API is called can be found in the [integration tests](../integration-tests) module

## RestClient collection- example requests to the SDS API

A RestClient collection [rest-client/spine-directory-service](../rest-client/spine-directory-service) illustrates how the SDS Adaptor API
is called. This collection provides following API request examples:
-health check
-routing and reliability information from the spine

Before sending these requests, you will need to create a setting.json file as described in [README](../rest-client/README.md).

## Operating the SDS Adaptor in your infrastructure

Refer to [Operating the SDS Adaptor](operating-sds-adaptor.md) for information on how to operate the SDS Adaptor as it is deployed
within the boundary of your infrastructure.

## Developer Setup

For information targeted at developers making use of the SDS Adaptor, please refer to [SDS Adaptor developer notes](sds-adaptor-dev-notes.md).
For just test-driving the SDS Adaptor check [how to run SDS Adaptor locally](running-sds-adaptor-locally.md).

