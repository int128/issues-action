import * as core from '@actions/core'
import * as github from '@actions/github'
import { RequestError } from '@octokit/request-error'
import { appendOrUpdateBody } from './body'
import { Issue, Octokit } from './types'

export type Inputs = {
  issueNumbers: number[]
  context: boolean
  token: string
} & Operations

type Operations = {
  addLabels: string[]
  removeLabels: string[]
  postComment: string
  appendOrUpdateBody: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const octokit = github.getOctokit(inputs.token)
  const { owner, repo } = github.context.repo
  const issues = inputs.issueNumbers.map((number) => ({ owner, repo, number }))

  if (inputs.context) {
    const pulls = await inferPullRequestFromContext(octokit)
    issues.push(...pulls)
  }

  for (const issue of issues) {
    core.startGroup(`processing #${issue.number}`)
    await processIssue(octokit, inputs, issue)
    core.endGroup()
  }
}

const inferPullRequestFromContext = async (octokit: Octokit): Promise<Issue[]> => {
  if (Number.isSafeInteger(github.context.issue.number)) {
    core.info(`inferred #${github.context.issue.number} from the current context`)
    return [
      {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        number: github.context.issue.number,
      },
    ]
  }

  core.info(`list pull request(s) associated with ${github.context.sha}`)
  const pulls = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: github.context.sha,
  })
  const issues = pulls.data.map((pr) => ({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    number: pr.number,
    body: pr.body || '',
  }))
  core.info(`inferred pull requests: ${issues.map((i) => `#${i.number}`).join(`, `)}`)
  return issues
}

const processIssue = async (octokit: Octokit, r: Operations, issue: Issue): Promise<void> => {
  if (r.addLabels.length > 0) {
    const { data: added } = await octokit.rest.issues.addLabels({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      labels: r.addLabels,
    })
    core.info(`added label(s) to #${issue.number}: ${added.map((label) => label.name).join(', ')}`)
  }

  for (const labelName of r.removeLabels) {
    try {
      const { data: removed } = await octokit.rest.issues.removeLabel({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        name: labelName,
      })
      core.info(`removed label ${labelName} from #${issue.number}: ${removed.map((label) => label.name).join(', ')}`)
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        core.warning(`could not remove label ${labelName} from #${issue.number}: ${error.message}`)
        continue
      }
      throw error
    }
  }

  if (r.postComment !== '') {
    const { data: created } = await octokit.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: r.postComment,
    })
    core.info(`create a comment to #${issue.number}: ${created.html_url}`)
  }

  if (r.appendOrUpdateBody) {
    await appendOrUpdateBody(octokit, issue, r.appendOrUpdateBody)
  }
}
