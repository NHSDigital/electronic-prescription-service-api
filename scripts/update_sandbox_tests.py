#!/usr/bin/env python3
"""
update_sandbox_tests.py

Updates expected e2e integration test json responses and their corresponding requests from the sandbox,
converting dates correctly.

Usage:
  update_sandbox_tests.py
"""

import json
import datetime


def date_converter(obj):
    """Date and datetime converter to correctly render dates in json"""
    if isinstance(obj, datetime.datetime):
        return obj.replace(tzinfo=datetime.timezone.utc).isoformat()
    if isinstance(obj, datetime.date):
        return obj.isoformat()
    return obj


def main():
    """Main entrypoint"""
    postman_file_path = "./tests/e2e/electronic-prescription-service-api-sandbox.json.template"
    with open(postman_file_path) as f:
        data = json.load(f)

    prepare_success_request_file_path = "./models/dist/requests/PrepareSuccessRequest.json"
    with open(prepare_success_request_file_path) as f:
        prepare_success_request = json.load(f)

    prepare_success_response_file_path = "./models/dist/responses/PrepareSuccessResponse.json"
    with open(prepare_success_response_file_path) as f:
        prepare_success_response = json.load(f)

    send_success_request_file_path = "./models/dist/requests/SendSuccessRequest.json"
    with open(send_success_request_file_path) as f:
        send_success_request = json.load(f)

    send_success_response_file_path = "./models/dist/responses/SendSuccessResponse.json"
    with open(send_success_response_file_path) as f:
        send_success_response = json.load(f)

    for item in data['item']:
        for event in item['event']:
            if (event['script']['id'] == "e141b53f-c47f-47de-8be4-3d0335779985"):
                item['request']['body']['raw'] = json.dumps(
                    prepare_success_request,
                    default=date_converter,
                    separators=(',', ':'))

                event['script']['exec'] = [
                    "const responseString = '" +
                    json.dumps(prepare_success_response, default=date_converter, separators=(',', ':'))
                    + "'",
                    "pm.test(\"Status code is 200\", function () {",
                    "    pm.response.to.have.status(200);",
                    "});",
                    "pm.test(\"Body is correct\", function () {",
                    "    pm.response.to.have.body(responseString);",
                    "});"
                ]
            elif (event['script']['id'] == "e1bb1e7c-28ae-44e5-bbc4-d7480fea488e"):
                item['request']['body']['raw'] = json.dumps(
                    send_success_request,
                    default=date_converter,
                    separators=(',', ':'))

                event['script']['exec'] = [
                    "const responseString = '" + json.dumps(
                        send_success_response,
                        default=date_converter,
                        separators=(',', ':')) + "'",
                    "pm.test(\"Status code is 200\", function () {",
                    "    pm.response.to.have.status(200);",
                    "});",
                    "pm.test(\"Body is correct\", function () {",
                    "    pm.response.to.have.body(responseString);",
                    "});"
                ]

    with open(
            "./tests/e2e/electronic-prescription-service-api-sandbox.json",
            "w"
    ) as out_file:
        out_file.write(
            json.dumps(data, default=date_converter, indent=2)
        )


if __name__ == "__main__":
    main()
