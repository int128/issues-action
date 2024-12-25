import * as core from '@actions/core'
import { appendOrUpdateBody } from './body.js'
import { Context, getOctokit, Issue, Octokit } from './github.js'
import { RequestError } from '@octokit/request-error'

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

  core.info(`List pull request(s) associated with ${context.sha}`)
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
  core.info(`Using pull requests: ${issues.map((i) => `#${i.number}`).join(`, `)}`)
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
      `Added label(s) to ${issue.owner}/${issue.repo}#${issue.number}: ${added.map((label) => label.name).join(', ')}`,
    )
  }

  for (const labelName of r.removeLabels) {
    try {
      await octokit.rest.issues.removeLabel({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        name: labelName,
      })
      core.info(`Removed label ${labelName} from ${issue.owner}/${issue.repo}#${issue.number}`)
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        core.warning(
          `Could not remove label ${labelName} from ${issue.owner}/${issue.repo}#${issue.number}: ${error.message}`,
        )
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
    core.info(`Created a comment to ${issue.owner}/${issue.repo}#${issue.number}: ${created.html_url}`)
  }

  if (r.appendOrUpdateBody) {
    await appendOrUpdateBody(octokit, issue, r.appendOrUpdateBody)
  }
}
