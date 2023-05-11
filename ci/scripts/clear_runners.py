import json

import boto3
import requests


def get_github_access_token() -> str:
    client = boto3.client("secretsmanager")
    response = client.get_secret_value(
        SecretId="nhsd-nrlf--mgmt--github-personal-access-token"  # pragma: allowlist secret
    )
    return response["SecretString"]


def get_all_runners(github_access_token: str) -> list[dict]:
    response = requests.get(
        url="https://api.github.com/repos/NHSDigital/NRLF/actions/runners",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {github_access_token}",
        },
    )
    return json.loads(response.text)["runners"]


def delete_runner(runner_id: str, github_access_token: str):
    response = requests.delete(
        url=f"https://api.github.com/repos/NHSDigital/NRLF/actions/runners/{runner_id}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {github_access_token}",
        },
    )
    print(response.status_code)
    print(response.text)


def main():
    github_access_token = get_github_access_token()
    runners = get_all_runners(github_access_token)
    for runner in runners:
        print(f'Deleting github runner, id: {runner["id"]}, name: {runner["name"]}')
        delete_runner(runner["id"], github_access_token)


if __name__ == "__main__":
    main()
