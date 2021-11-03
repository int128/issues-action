# issues-action [![ts](https://github.com/int128/issues-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/issues-action/actions/workflows/ts.yaml)

This is an action for the following bulk operations:

- Post a comment to issues or pull requests
- Add label(s) to issues or pull requests
- Remove label(s) from issues or pull requests


## Inputs

This action accepts the following inputs:

| Name | Default | Description
|------|---------|------------
| `issue-numbers` | - | List of issue(s) or pull request(s), in multiline string
| `sha` | - | Find pull request(s) associated with a commit sha
| `add-labels` | - | Label name(s) to add to issues or pull requests, in multiline string
| `remove-labels` | - | Label name(s) to remove from issues or pull requests, in multiline string
| `post-comment` | - | Comment body to create into issues or pull requests
| `token` | `github.token` | A token for GitHub API

If `issue-numbers` is not set, this action does nothing.


## Example

### Post a comment to opened pull requests

This example calls the action with [actions/github-script](https://github.com/actions/github-script).

```yaml
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - id: list-open-pulls
        uses: actions/github-script@v5
        with:
          result-encoding: string
          script: |
            const response = await github.graphql(`
              query ($owner: String!, $name: String!) {
                repository(owner: $owner, name: $name) {
                  pullRequests(states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}, first: 10) {
                    nodes {
                      number
                    }
                  }
                }
              }
            `, {
              owner: context.repo.owner,
              name: context.repo.repo,
            })
            core.info(`response = ${JSON.stringify(response, undefined, 2)}`)
            return response.repository.pullRequests.nodes.map((e) => e.number).join('\n')

      - uses: int128/issues-action@v2
        with:
          issue-numbers: ${{ steps.list-open-pulls.outputs.result }}
          remove-labels: deploy
          post-comment: |
            :zzz: This pull request has been stopped. Add `deploy` label to deploy again.
```


### Pull request(s) associated with a commit

To post a comment to pull request(s) associated with a commit:

```yaml
on:
  push:
    branches:
      - main

jobs:
  notify:
    steps:
      - uses: int128/issues-action@v2
        with:
          sha: ${{ github.sha }}
          post-comment: |
            :x: error
```
