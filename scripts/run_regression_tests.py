"""
  Script to generate user defined unique ID which can be used to
  check the status of the regression test run to be reported to the CI.
"""

import argparse
import datetime
import random
import string
import requests
import time
from requests.auth import HTTPBasicAuth

parser = argparse.ArgumentParser()

# command line arguments
parser.add_argument(
    "--env",
    required=True,
    help="Please provide the environment you wish to run in.",
)

parser.add_argument(
    "--user",
    required=True,
    help="Please provide the user credentials.",
)

argument = parser.parse_args()

user_credentials = argument.user.split(":")
# print(user_credentials)
authHeader = HTTPBasicAuth(user_credentials[0], user_credentials[1])
# print(f"hello Header: {authHeader}")

run_identifier = "".join(random.choices(string.ascii_uppercase + string.digits, k=15))
# filter runs that were created after this date minus 5 minutes
delta_time = datetime.timedelta(minutes=5)
run_date_filter = (datetime.datetime.utcnow() - delta_time).strftime("%Y-%m-%dT%H:%M")
body = {
    "ref": "AEA-3578",
    "inputs": {
        "id": run_identifier,
        "tags": "@regression",
        "environment": argument.env,
    },
}
# print(f"Hello body: {body}")

request = requests.post(
    url="https://api.github.com/repos/NHSDigital/electronic-prescription-service-api-regression-tests/actions/workflows/regression_tests.yml/dispatches",
    headers={
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    },
    auth=authHeader,
    json=body,
)

print(
    f"dispatch workflow status: {request.status_code} | workflow identifier: {run_identifier}"
)
assert request.status_code == 204
workflow_id = ""

while workflow_id == "":
    request = requests.get(
        f"https://api.github.com/repos/NHSDigital/electronic-prescription-service-api-regression-tests/actions/runs?created=%3E{run_date_filter}",
        headers={
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        auth=authHeader,
    )
    runs = request.json()["workflow_runs"]

    if len(runs) > 0:
        for workflow in runs:
            jobs_url = workflow["jobs_url"]
            print(f"get jobs_url {jobs_url}")

            request = requests.get(jobs_url, auth=authHeader)

            jobs = request.json()["jobs"]
            if len(jobs) > 0:
                # we only take the first job, edit this if you need multiple jobs
                job = jobs[0]
                steps = job["steps"]
                if len(steps) >= 2:
                    third_step = steps[
                        2
                    ]  # if you have position the run_identifier step at 1st position
                    if third_step["name"] == run_identifier:
                        workflow_id = job["run_id"]

                        if workflow_id:
                            request = requests.get(
                                f"https://api.github.com/repos/NHSDigital/electronic-prescription-service-api-regression-tests/actions/runs/{workflow_id}/jobs",
                                headers={
                                    "Accept": "application/vnd.github+json",
                                    "X-GitHub-Api-Version": "2022-11-28",
                                },
                                auth=authHeader,
                            )
                            final_job = request.json()["jobs"][0]
                            print(final_job)
                            if final_job["status"] == "completed":
                                if final_job["conclusion"] == "succeeded":
                                    print("PASSED")
                                if final_job["conclusion"] == "failed":
                                    print("FAILED")
                            else:
                                print("sorry It's been pending")

                else:
                    print("waiting for steps to be executed...")
                    time.sleep(3)
            else:
                print("waiting for jobs to popup...")
                time.sleep(3)
    else:
        print("waiting for workflows to popup...")
        time.sleep(3)

print(f"workflow_id: {workflow_id}")
