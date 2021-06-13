# issues-action [![ts](https://github.com/int128/issues-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/issues-action/actions/workflows/ts.yaml)

This is an action for bulk operation to issues and pull requests.


## Example

You can call this action with a result of [actions/github-script](https://github.com/actions/github-script) as follows:

```yaml
jobs:
  undeploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v4
        id: list-open-pulls
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
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
            return response.repository.pullRequests.nodes.map((node) => node.number)
      - uses: int128/issues-action@v1
        with:
          issue-numbers: ${{ steps.list-open-pulls.outputs.result }}
          remove-labels: deploy
          post-comment: |
            :warning: This pull request has been undeployed. Add `deploy` label to deploy again.
```


## Inputs

| Name | Type | Description
|------|------|------------
| `issue-numbers` | required | A number of issue or pull request, or an array of numbers of issues or pull requests in JSON format (e.g. `100` or `[100, 101]`)
| `add-labels` | optional | Label name(s) to add to issues or pull requests, in multi-line format
| `remove-labels` | optional | Label name(s) to remove from issues or pull requests, in multi-line format
| `post-comment` | optional | Comment body to create into issues or pull requests
| `token` | optional | A token for GitHub API
