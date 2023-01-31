import requests
import git
import os
import argparse
import re
from jira import JIRA

SCRIPT_LOCATION = os.path.join(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_LOCATION, ".."))
REPO = git.Repo(REPO_ROOT)
JIRA_TOKEN = os.getenv("JIRA_TOKEN")
JIRA_URL = "https://nhsd-jira.digital.nhs.uk/"


def get_commit_id(environment_name: str) -> str:
    if environment_name == "PROD":
        path = "https://api.service.nhs.uk/electronic-prescriptions/_ping"
    else:
        path = f"https://{environment_name}.api.service.nhs.uk/electronic-prescriptions/_ping"
    commit_id = requests.get(path).json()['commitId']
    return commit_id


def get_tag_for_commit(r: git.Repo, commit_id: str) -> str:
    for tag in r.tags:
        if r.commit(tag) == r.commit(commit_id):
            return tag


def get_jira_details(jira, jira_ticket_number: str) -> tuple[str, str, str]:
    try:
        jira_ticket = jira.issue(jira_ticket_number)
        jira_title = jira_ticket.fields.summary
        jira_description = jira_ticket.fields.description
        components = [component.name for component in jira_ticket.fields.components]
        match = re.search(r'(user story)((.|\n)*)background', jira_description, re.IGNORECASE)
        if match:
            user_story = match.group(2).replace("*", "").replace("h3.", "").strip()
        else:
            user_story = "can not find user story"
        return jira_title, user_story, components
    except:  # noqa: E722
        return f"can not find jira ticket for {jira_ticket_number}", "", ""


if __name__ == "__main__":
    script = argparse.ArgumentParser(description="Identify release notes for commits between two tags")

    script.add_argument(
        "--deploy-tag",
        help="A specific tag to deploy, otherwise use the version currently deployed to internal dev",
        required=False
    )

    script.add_argument(
        "--release-to",
        help="Which environment to generate release notes for - can be INT or PROD",
        choices=['INT', 'PROD'],
        required=False,
        default="INT"
    )

    args = script.parse_args()

    repo = git.Repo(REPO_ROOT)

    origin = repo.remote("origin")
    origin.fetch()

    target_commit_id = get_commit_id(args.release_to)
    internal_dev_commit_id = get_commit_id("internal-dev")

    target_tag = get_tag_for_commit(repo, target_commit_id)
    source_tag = args.deploy_tag or get_tag_for_commit(repo, internal_dev_commit_id)

    jira = JIRA(JIRA_URL, token_auth=JIRA_TOKEN)

    print(f"# EPS FHIR API planned release to {args.release_to} of tag {source_tag}\n")

    print(f"## Changes since currently released tag {target_tag}")
    tagged_commits = [repo.commit(tag) for tag in repo.tags]
    commits_in_range = repo.iter_commits(f"{target_tag}..{source_tag}")
    tagged_commits_in_range = [commit for commit in commits_in_range if commit in tagged_commits]
    for commit in tagged_commits_in_range:
        match = re.search(r'.*tags\/(.*)', commit.name_rev)
        if match:
            release_tag = match.group(1)
        else:
            release_tag = 'can not find release tag'
        first_commit_line = commit.message.splitlines()[0]
        match = re.search(r'(AEA[- ]\d*)', first_commit_line, re.IGNORECASE)
        if match:
            ticket_number = match.group(1).replace(' ', '-').upper()
            jira_link = f"https://nhsd-jira.digital.nhs.uk/browse/{ticket_number}"
            jira_title, user_story, components = get_jira_details(jira, ticket_number)

        else:
            jira_link = "n/a"
            jira_title = "n/a"
            user_story = "n/a"
            components = "n/a"
        print("\n***")
        print(f"jira link      : {jira_link}")
        print(f"jira title     : {jira_title}")
        print(f"user story     : {user_story}")
        print(f"commit title   : {first_commit_line}")
        print(f"release tag    : {release_tag}")
        print(f"github release : https://github.com/NHSDigital/electronic-prescription-service-api/releases/tag/{release_tag}")  # noqa: E501
        print(f"Area affected  : {components}")
        print("Impact         : <TODO>")
