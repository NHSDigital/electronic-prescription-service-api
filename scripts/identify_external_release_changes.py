import requests
import git
import os
import argparse
import re
from atlassian import Jira, Confluence
from typing import Tuple
import traceback
import sys

SCRIPT_LOCATION = os.path.join(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_LOCATION, ".."))
REPO = git.Repo(REPO_ROOT)
JIRA_TOKEN = os.getenv("JIRA_TOKEN")
JIRA_URL = "https://nhsd-jira.digital.nhs.uk/"
CONFLUENCE_TOKEN = os.getenv("CONFLUENCE_TOKEN")
CONFLUENCE_URL = "https://nhsd-confluence.digital.nhs.uk/"
PROD_RELEASE_NOTES_PAGE_ID = 587367100
INT_RELEASE_NOTES_PAGE_ID = 587367089


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


def get_jira_details(jira, jira_ticket_number: str) -> Tuple[str, str, str, str, str]:
    try:
        jira_ticket = jira.get_issue(jira_ticket_number)
        jira_title = jira_ticket["fields"]["summary"]
        jira_description = jira_ticket["fields"]["description"]
        components = [component["name"] for component in jira_ticket["fields"]["components"]]
        match = match = re.search(r'(user story)(.*?)background', jira_description,
                                  re.IGNORECASE | re.MULTILINE | re.DOTALL)
        if match:
            user_story = match.group(2).replace("*", "").replace("h3.", "").strip()
        else:
            user_story = "can not find user story"
        impact_field = jira_ticket.get("fields", {}).get("customfield_26905", {})
        if impact_field:
            impact = impact_field.get("value", "")
        else:
            impact = ""
        business_service_impact = jira_ticket["fields"].get("customfield_13618")
        return jira_title, user_story, components, impact, business_service_impact
    except:  # noqa: E722
        print(jira_ticket_number)
        print(traceback.format_exception(*sys.exc_info()))
        return f"can not find jira ticket for {jira_ticket_number}", "", "", "", ""
        raise


def append_output(current_output, text_to_add):
    return f"{current_output}\n{text_to_add}"


def create_release_notes(jira):
    output = ""

    output = append_output(output, f"<h1 id='Currentreleasenotes{args.release_to}-EPSFHIRAPIplannedreleasetoPRODoftag{source_tag}'>EPS FHIR API planned release to {args.release_to} of tag {source_tag}</h1>")  # noqa: E501
    output = append_output(output, f"<h2 id='Currentreleasenotes{args.release_to}-Changessincecurrentlyreleasedtag{target_tag}'>Changes since currently released tag {target_tag}</h2>")  # noqa: E501

    tagged_commits = [repo.commit(tag) for tag in repo.tags]
    commits_in_range = repo.iter_commits(f"{target_tag}..{source_tag}")
    tagged_commits_in_range = [commit for commit in commits_in_range if commit in tagged_commits]
    for commit in tagged_commits_in_range:
        match = re.search(r'tags\/(.*)$', commit.name_rev)
        if match:
            release_tag = match.group(1)
        else:
            release_tag = 'can not find release tag'
        first_commit_line = commit.message.splitlines()[0]
        match = re.search(r'(AEA[- ]\d*)', first_commit_line, re.IGNORECASE)
        if match:
            ticket_number = match.group(1).replace(' ', '-').upper()
            jira_link = f"https://nhsd-jira.digital.nhs.uk/browse/{ticket_number}"
            jira_title, user_story, components, impact, business_service_impact = get_jira_details(jira, ticket_number)
        else:
            jira_link = "n/a"
            jira_title = "n/a"
            user_story = "n/a"
            components = "n/a"
            impact = "n/a"
            business_service_impact = "n/a"
        user_story = user_story.replace("\n", "\n<br/>")
        github_link = f"https://github.com/NHSDigital/electronic-prescription-service-api/releases/tag/{release_tag}"
        output = append_output(output, "<p>***")

        output = append_output(output, f"<br/>jira link               :  <a class='external-link' href='{jira_link}' rel='nofollow'>{jira_link}</a>")  # noqa: E501
        output = append_output(output, f"<br/>jira title              : {jira_title}")
        output = append_output(output, f"<br/>user story              : {user_story}")
        output = append_output(output, f"<br/>commit title            : {first_commit_line}")
        output = append_output(output, f"<br/>release tag             : {release_tag}")
        output = append_output(output, f"<br/>github release          : <a class='external-link' href='{github_link}' rel='nofollow'>{github_link}</a>")  # noqa: E501
        output = append_output(output, f"<br/>Area affected           : {components}")
        output = append_output(output, f"<br/>Impact                  : {impact}")
        output = append_output(output, f"<br/>Business/Service Impact : {business_service_impact}")
        output = append_output(output, "</p>")

    return output


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

    jira = Jira(JIRA_URL, token=JIRA_TOKEN)
    output = create_release_notes(jira)
    print(output)
    confluence = Confluence(CONFLUENCE_URL, token=CONFLUENCE_TOKEN)
    if args.release_to == "INT":
        target_confluence_page_id = INT_RELEASE_NOTES_PAGE_ID
        confluence_page_title = "Current release notes - INT"
    else:
        target_confluence_page_id = PROD_RELEASE_NOTES_PAGE_ID
        confluence_page_title = "Current release notes - PROD"
    confluence.update_page(page_id=target_confluence_page_id, body=output, title=confluence_page_title)
