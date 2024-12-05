#!/usr/bin/env python

"""
  Script to generate user defined unique ID which can be used to
  check the status of the regression test run to be reported to the CI.
"""
import argparse
from datetime import datetime, timedelta, timezone
import random
import string
import requests
import time

# This should be set to a known good version of regression test repo
REGRESSION_TESTS_REPO_TAG = "prescribe_dispense_seperate_tests"

GITHUB_API_URL = "https://api.github.com/repos/NHSDigital/electronic-prescription-service-api-regression-tests/actions"
GITHUB_RUN_URL = "https://github.com/NHSDigital/electronic-prescription-service-api-regression-tests/actions/runs"


def get_headers():
    return {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Authorization": f"Bearer {arguments.token}",
    }


def generate_unique_run_id(length=15):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def generate_timestamp():
    delta_time = timedelta(minutes=2)
    date_time = (datetime.now(timezone.utc) - delta_time).strftime("%Y-%m-%dT%H:%M")
    print(f"Generated Date as: {date_time}")
    return date_time


def trigger_test_run():
    pr_label = arguments.pr_label.lower()
    env = "INTERNAL-DEV" if arguments.env == "dev-pr" else arguments.env
    body = {
        "ref": "main",
        "inputs": {
            "id": run_id,
            "tags": "@regression",
            "environment": env,
            "pull_request_id": pr_label,
            "product": arguments.product,
            "github_tag": REGRESSION_TESTS_REPO_TAG
        },
    }

    response = requests.post(
        url=f"{GITHUB_API_URL}/workflows/regression_tests.yml/dispatches",
        headers=get_headers(),
        json=body,
    )

    print(f"Dispatch workflow. Unique workflow identifier: {run_id}")
    assert (
        response.status_code == 204
    ), f"Failed to trigger test run. Expected 204, got {response.status_code}. Response: {response.text}"


def get_workflow_runs():
    print(f"Getting workflow runs after date: {run_date_filter}")
    response = requests.get(
        f"{GITHUB_API_URL}/runs?created=%3E{run_date_filter}",
        headers=get_headers(),
    )
    assert (
        response.status_code == 200
    ), f"Unable to get workflow runs. Expected 200, got {response.status_code}"
    return response.json()["workflow_runs"]


def get_jobs_for_workflow(jobs_url):
    print("Getting jobs for workflow...")
    response = requests.get(
        jobs_url,
        headers=get_headers(),
    )
    assert (
        response.status_code == 200
    ), f"Unable to get workflow jobs. Expected 200, got {response.status_code}"
    return response.json()["jobs"]


def find_workflow():
    max_attempts = 5
    current_attempt = 0

    while current_attempt < max_attempts:
        time.sleep(10)
        current_attempt = current_attempt + 1
        print(f"Attempt {current_attempt}")

        workflow_runs = get_workflow_runs()
        for workflow in workflow_runs:
            time.sleep(3)
            current_workflow_id = workflow["id"]
            jobs_url = workflow["jobs_url"]

            list_of_jobs = get_jobs_for_workflow(jobs_url)
            if is_correct_job(list_of_jobs) is True:
                print(f"Workflow Job found! Using ID: {current_workflow_id}")
                return current_workflow_id
        print(
            "Processed all available workflows but no jobs were matching the Unique ID were found!"
        )


def is_correct_job(list_of_jobs):
    job = list_of_jobs[0]
    steps = job["steps"]

    if len(steps) >= 2:
        third_step = steps[2]
        if third_step["name"] == run_id:
            return True
    else:
        print("Jobs for this workflow run haven't populated yet...")


def get_job():
    job_request_url = f"{GITHUB_API_URL}/runs/{workflow_id}/jobs"
    job_response = requests.get(job_request_url, headers=get_headers())

    return job_response.json()["jobs"][0]


def check_job():
    print("Checking job status, please wait...")
    print("Current status:", end=" ")
    job = get_job()
    job_status = job["status"]

    while job_status != "completed":
        print(job_status)
        time.sleep(10)
        job = get_job()
        job_status = job["status"]

    if job["conclusion"] != "success":
        pr_label = arguments.pr_label.lower()
        env = f"PULL_REQUEST/{pr_label}" if arguments.env == "dev-pr" else arguments.env.upper()
        print("The regressions test step failed! There are likely test failures.")
        print(f"See {GITHUB_RUN_URL}/{workflow_id}/ for run details)")
        print(f"See https://ubiquitous-adventure-p8885yq.pages.github.io/{arguments.product}/{env}/ for allure report")
        raise Exception("Regression test failed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--pr_label",
        required=False,
        help="Please provide the PR number.",
    )
    parser.add_argument(
        "--env",
        required=True,
        help="Please provide the environment you wish to run in.",
    )
    parser.add_argument(
        "--token", required=True, help="Please provide the authentication token."
    )
    parser.add_argument(
        "--product", required=True, help="Please provide the product to run the tests for."
    )

    arguments = parser.parse_args()
    run_id = generate_unique_run_id()
    run_date_filter = generate_timestamp()

    trigger_test_run()

    workflow_id = find_workflow()
    check_job()
    print("Success!")
