# issues-action [![ts](https://github.com/int128/issues-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/issues-action/actions/workflows/ts.yaml)

This is an action for the following operations to issues or pull requests:

- Post a comment
- Add label(s)
- Remove label(s)
- Update an issue body

## Getting Started

### Post comment

To post a comment to the current pull request,

```yaml
steps:
  - uses: int128/issues-action@v2
    with:
      context: true
      post-comment: |
        :white_check_mark: test passed
```

For example,

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/172045090-f103f203-c74c-4432-bcbc-b6b0794a4747.png">

To post a comment to open pull requests,

```yaml
steps:
  - uses: int128/issues-action@v2
    with:
      search-query: repo:${{ github.repository }} is:pr is:open
      post-comment: |
        :zzz: This pull request has been undeployed. Set the label to deploy again.
```

### Add or remove label

To add and remove a label to the current pull request,

```yaml
steps:
  - uses: int128/issues-action@v2
    with:
      context: true
      add-labels: test-passed
      remove-labels: test-failed
```

For example,

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/172045138-a5df6f63-7476-4ddd-9994-cd3b991015e7.png">

### Update body

To append a content into the body of current pull request,

```yaml
steps:
  - uses: int128/issues-action@v2
    with:
      context: true
      append-or-update-body: |
        ----
        :octocat: Tested in ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

For example,

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/172045350-83d43ba1-df0e-4dfb-ae4e-466f11d87e3b.png">

If the content already exists in the pull request, this action replaces it with the new one.

## Specification

This action accepts the following inputs:

| Name                    | Default        | Description                                                               |
| ----------------------- | -------------- | ------------------------------------------------------------------------- |
| `issue-numbers`         | -              | List of issue(s) or pull request(s), in multiline string                  |
| `search-query`          | -              | If set, search the issues by the query                                    |
| `context`               | `false`        | If true, infer an issue or pull request(s) from the context               |
| `add-labels`            | -              | Label name(s) to add to issues or pull requests, in multiline string      |
| `remove-labels`         | -              | Label name(s) to remove from issues or pull requests, in multiline string |
| `post-comment`          | -              | Comment to create into issues or pull requests                            |
| `append-or-update-body` | -              | Update body of issues or pull requests                                    |
| `token`                 | `github.token` | A token for GitHub API                                                    |

If `issue-numbers` is not set, this action does nothing.

### Search the issues

If `search-query` is set, this action searches the issues.

```yaml
steps:
  - uses: int128/issues-action@v2
    with:
      search-query: repo:${{ github.repository }} is:pr is:open
```

For details of the query, see [GitHub Search API](https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-issues-and-pull-requests).
To search the issues of the current repository, put `repo:${{ github.repository }}` into the query.

Note that GitHub Search API has the rate limit of 30 requests per minute.
This action intentionally does not paginate the search result.

### Infer the current pull request

If `context` is true, this action infers by the following rules:

- On `pull_request` event, use the current pull request
- On `issue` event, use the current issue
- On other events, find pull request(s) associated with `github.sha`

To post a comment when a pull request is created, updated or merged into main branch:

```yaml
on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

jobs:
  comment:
    steps:
      - uses: int128/issues-action@v2
        with:
          context: true
          post-comment: |
            :x: something wrong
```
