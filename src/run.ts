import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import { appendOrUpdateBody } from './body.js'
import { type Context, catchStatusError, type Issue } from './github.js'

export type Inputs = {
  issueNumbers: Set<number>
  context: boolean
  dryRun: boolean
} & Operations

type Operations = {
  addLabels: Set<string>
  removeLabels: Set<string>
  postComment: string
  appendOrUpdateBody: string
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<void> => {
  const issues = [...inputs.issueNumbers].map((number) => ({
    owner: context.repo.owner,
    repo: context.repo.repo,
    number,
  }))

  if (inputs.context) {
    issues.push(...(await inferIssuesFromContext(octokit, context)))
  }

  for (const issue of issues) {
    if (inputs.dryRun) {
      core.info(`dry-run: Processing ${issue.owner}/${issue.repo}#${issue.number}`)
    } else {
      core.startGroup(`Processing ${issue.owner}/${issue.repo}#${issue.number}`)
      await processIssue(issue, inputs, octokit, context)
      core.endGroup()
    }
  }
}

const inferIssuesFromContext = async (octokit: Octokit, context: Context): Promise<Issue[]> => {
  if ('issue' in context.payload) {
    core.info(`Inferred #${context.payload.issue.number} from the issue event`)
    return [
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        number: context.payload.issue.number,
      },
    ]
  }
  if ('pull_request' in context.payload) {
    core.info(`Inferred #${context.payload.pull_request.number} from the pull_request event`)
    return [
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        number: context.payload.pull_request.number,
      },
    ]
  }

  core.info(`List the pull request(s) associated with ${context.sha}`)
  const pulls = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    commit_sha: context.sha,
  })
  const issues = pulls.data.map((pr) => ({
    owner: context.repo.owner,
    repo: context.repo.repo,
    number: pr.number,
    body: pr.body || '',
  }))
  core.info(`Using the pull requests: ${issues.map((i) => `#${i.number}`).join(`, `)}`)
  return issues
}

const processIssue = async (issue: Issue, r: Operations, octokit: Octokit, context: Context): Promise<void> => {
  if (r.addLabels.size > 0) {
    const { data: added } = await octokit.rest.issues.addLabels({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      labels: [...r.addLabels],
    })
    core.info(
      `Added the label(s) to ${issue.owner}/${issue.repo}#${issue.number}: ${added.map((label) => label.name).join(', ')}`,
    )
  }

  for (const labelName of r.removeLabels) {
    const removed = await catchStatusError(
      404,
      octokit.rest.issues.removeLabel({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        name: labelName,
      }),
    )
    if (removed === undefined) {
      core.info(`${issue.owner}/${issue.repo}#${issue.number} does not have the label ${labelName}`)
      continue
    }
    core.info(`Removed the label ${labelName} from ${issue.owner}/${issue.repo}#${issue.number}`)
  }

  if (r.postComment !== '') {
    const { data: created } = await octokit.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: r.postComment,
    })
    core.info(`Created a comment to ${issue.owner}/${issue.repo}#${issue.number}: ${created.html_url}`)
  }

  if (r.appendOrUpdateBody) {
    await appendOrUpdateBody(issue, r.appendOrUpdateBody, octokit, context)
  }
}
