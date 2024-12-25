import * as core from '@actions/core'
import { appendOrUpdateBody } from './body.js'
import { catchStatusError, Context, getOctokit, Issue, Octokit } from './github.js'

export type Inputs = {
  issueNumbers: number[]
  context: boolean
  dryRun: boolean
  token: string
} & Operations

type Operations = {
  addLabels: string[]
  removeLabels: string[]
  postComment: string
  appendOrUpdateBody: string
}

export const run = async (inputs: Inputs, context: Context): Promise<void> => {
  const octokit = getOctokit(inputs.token)

  const issues = inputs.issueNumbers.map((number) => ({
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
      await processIssue(octokit, inputs, issue)
      core.endGroup()
    }
  }
}

const inferIssuesFromContext = async (octokit: Octokit, context: Context): Promise<Issue[]> => {
  if (Number.isSafeInteger(context.issue.number)) {
    core.info(`Inferred #${context.issue.number} from the current workflow run`)
    return [
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        number: Number(context.issue.number),
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

const processIssue = async (octokit: Octokit, r: Operations, issue: Issue): Promise<void> => {
  if (r.addLabels.length > 0) {
    const { data: added } = await octokit.rest.issues.addLabels({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      labels: r.addLabels,
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
    await appendOrUpdateBody(octokit, issue, r.appendOrUpdateBody)
  }
}
