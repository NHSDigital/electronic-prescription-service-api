import argparse
import datetime
import random
import string
import requests
import time
from requests.auth import HTTPBasicAuth

GITHUB_API_BASE_URL = "https://api.github.com/repos/NHSDigital/electronic-prescription-service-api-regression-tests/actions"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def generate_unique_run_id(length=15):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def get_auth_header(user_credentials):
    return HTTPBasicAuth(user_credentials[0], user_credentials[1])


def get_latest_result():
    delta_time = datetime.timedelta(minutes=5)
    return (datetime.datetime.utcnow() - delta_time).strftime("%Y-%m-%dT%H:%M")


def post_workflow_dispatch(env, user_credentials):
    run_id = generate_unique_run_id()

    auth_header = get_auth_header(user_credentials)

    body = {
        "ref": "main",
        "inputs": {
            "id": run_id,
            "tags": "@regression",
            "environment": env,
        },
    }

    dispatches_request = requests.post(
        url=f"{GITHUB_API_BASE_URL}/workflows/regression_tests.yml/dispatches",
        headers=HEADERS,
        auth=auth_header,
        json=body,
    )

    print(
        f"dispatch workflow status: {dispatches_request.status_code} | workflow identifier: {run_id}"
    )
    assert dispatches_request.status_code == 204

    return run_id


def get_workflow_id(auth_header, run_date_filter):
    workflow_id = ""

    while workflow_id == "":
        workflow_id_request = requests.get(
            f"{GITHUB_API_BASE_URL}/runs?created=%3E{run_date_filter}",
            headers=HEADERS,
            auth=auth_header,
        )
        runs = workflow_id_request.json()["workflow_runs"]

        if runs:
            for workflow in runs:
                jobs_url = workflow["jobs_url"]
                print(f"get jobs_url {jobs_url}")

                request = requests.get(jobs_url, auth=auth_header)
                jobs = request.json()["jobs"]

                if jobs:
                    job = jobs[0]
                    steps = job["steps"]

                    if len(steps) >= 2:
                        third_step = steps[2]
                        if third_step["name"] == run_id:
                            workflow_id = job["run_id"]
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
    return workflow_id


def wait_for_job_completion(auth_header, workflow_id):
    job_request_url = f"{GITHUB_API_BASE_URL}/runs/{workflow_id}/jobs"
    job_request = requests.get(
        job_request_url,
        headers=HEADERS,
        auth=auth_header,
    )

    job = job_request.json()["jobs"][0]

    while job["status"] != "completed":
        time.sleep(3)
        status_request = requests.get(
            job_request_url,
            headers=HEADERS,
            auth=auth_header,
        )
        job = status_request.json()["jobs"][0]
        print(job["status"])

    assert (
        job["conclusion"] == "success"
    ), "The regressions test step failed! There are likely test failures."


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--env",
        required=True,
        help="Please provide the environment you wish to run in.",
    )
    parser.add_argument(
        "--user", required=True, help="Please provide the user credentials."
    )

    arguments = parser.parse_args()
    user_credentials = arguments.user.split(":")

    run_id = post_workflow_dispatch(arguments.env, user_credentials)
    auth_header = get_auth_header(user_credentials)
    run_date_filter = get_latest_result()

    workflow_id = get_workflow_id(auth_header, run_date_filter)
    wait_for_job_completion(auth_header, workflow_id)
