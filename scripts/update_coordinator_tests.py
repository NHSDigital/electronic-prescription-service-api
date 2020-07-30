#!/usr/bin/env python3
"""
update_coordinator_tests.py

Updates expected e2e integration test json responses and their corresponding requests for the
coordinator, converting dates correctly.

Usage:
  update_coordinator_tests.py
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
    postman_file_path = "./tests/e2e/postman/electronic-prescription-coordinator-postman-tests.json.template"
    with open(postman_file_path) as f:
        data = json.load(f)

    convert_success_request_file_path = \
        "./models/dist/examples/example-1-repeat-dispensing/SendRequest-FhirMessageSigned.json"
    with open(convert_success_request_file_path) as f:
        convert_success_request = json.load(f)

    convert_success_response_file_path = \
        "./models/dist/examples/example-1-repeat-dispensing/ConvertResponse-Hl7V3Message.xml"
    with open(convert_success_response_file_path) as f:
        convert_success_response = f.read().replace("\n", "\\n")

    prepare_success_request_file_path = \
        "./models/dist/examples/example-1-repeat-dispensing/PrepareRequest-FhirMessageUnsigned.json"
    with open(prepare_success_request_file_path) as f:
        prepare_success_request = json.load(f)

    prepare_success_response_file_path = \
        "./models/dist/examples/example-1-repeat-dispensing/PrepareResponse-FhirMessageDigest.json"
    with open(prepare_success_response_file_path) as f:
        prepare_success_response = json.load(f)

    send_success_request_file_path = \
        "./models/dist/examples/example-1-repeat-dispensing/SendRequest-FhirMessageSigned.json"
    with open(send_success_request_file_path) as f:
        send_success_request = json.load(f)

    for item in data['item']:
        for event in item['event']:
            if event['script']['id'] == "582bca6a-3e80-4609-be0c-1fc7a05d7d34":
                item['request']['body']['raw'] = json.dumps(
                    convert_success_request,
                    default=date_converter,
                    separators=(',', ':'))

                event['script']['exec'] = [
                    "const expectedResponseString = '" + convert_success_response[:-2] + "'",
                    "pm.test(\"Status code is 200\", function () {",
                    "    pm.response.to.have.status(200);",
                    "});",
                    "pm.test(\"Body is correct\", function () {",
                    "    const actualResponseStringWithCorrectedTime = pm.response.text().replace(",
                    "        /<creationTime value=\"[0-9]{14}\"\\/>/,",
                    "        \"<creationTime value=\\\"20200610102631\\\"/>\"",
                    "    )",
                    "    console.log(\"=====EXPECTED=====\")",
                    "    console.log(expectedResponseString)",
                    "    console.log(\"=====ACTUAL=====\")",
                    "    console.log(actualResponseStringWithCorrectedTime)",
                    "    pm.expect(actualResponseStringWithCorrectedTime).to.equal(expectedResponseString);",
                    "});"
                ]
            elif event['script']['id'] == "630e7726-f2e1-4bf9-a90f-08350d24e70d":
                item['request']['body']['raw'] = json.dumps(
                    prepare_success_request,
                    default=date_converter,
                    separators=(',', ':'))

                event['script']['exec'] = [
                    "const responseString = '" +
                    json.dumps(prepare_success_response, default=date_converter, indent=2)
                    .replace("\\", "\\\\")
                    .replace("\n", "\\n")
                    + "'",
                    "pm.test(\"Status code is 200\", function () {",
                    "    pm.response.to.have.status(200);",
                    "});",
                    "pm.test(\"Body is correct\", function () {",
                    "    console.log(\"=====EXPECTED=====\")",
                    "    console.log(responseString)",
                    "    console.log(\"=====ACTUAL=====\")",
                    "    console.log(pm.response.text())",
                    "    pm.response.to.have.body(responseString);",
                    "});"
                ]
            elif event['script']['id'] == "400fb7e1-0145-41c8-9523-282c047ee1db":
                item['request']['body']['raw'] = json.dumps(
                    send_success_request,
                    default=date_converter,
                    separators=(',', ':'))

                event['script']['exec'] = [
                    "const responseString = 'Message Sent'",
                    "pm.test(\"Status code is 200\", function () {",
                    "    pm.response.to.have.status(200);",
                    "});",
                    "pm.test(\"Body is correct\", function () {",
                    "    console.log(\"=====EXPECTED=====\")",
                    "    console.log(responseString)",
                    "    console.log(\"=====ACTUAL=====\")",
                    "    console.log(pm.response.text())",
                    "    pm.response.to.have.body(responseString);",
                    "});"
                ]

    with open(
            "./tests/e2e/postman/electronic-prescription-coordinator-postman-tests.json",
            "w"
    ) as out_file:
        out_file.write(
            json.dumps(data, default=date_converter, indent=2)
        )


if __name__ == "__main__":
    main()
