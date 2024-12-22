import assert from 'assert'
import * as core from '@actions/core'
import { appendOrUpdateBody } from './body.js'
import { Context, getOctokit, Octokit } from './github.js'
import { Issue } from './types.js'
import { RequestError } from '@octokit/request-error'

export type Inputs = {
  issueNumbers: number[]
  searchQuery: string
  context: boolean
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
  const { owner, repo } = context.repo
  const issues = inputs.issueNumbers.map((number) => ({ owner, repo, number }))

  if (inputs.searchQuery) {
    const found = await searchIssues(octokit, inputs.searchQuery)
    issues.push(...found)
  }

  if (inputs.context) {
    const pulls = await inferPullRequestFromContext(octokit, context)
    issues.push(...pulls)
  }

  for (const issue of issues) {
    core.startGroup(`Processing ${issue.owner}/${issue.repo}#${issue.number}`)
    await processIssue(octokit, inputs, issue)
    core.endGroup()
  }
}

const searchIssues = async (octokit: Octokit, q: string): Promise<Issue[]> => {
  core.info(`Searching issues by query: ${q}`)
  const { data: issues } = await octokit.rest.search.issuesAndPullRequests({
    q,
    per_page: 100,
  })
  return issues.items.map((issue): Issue => {
    const { owner, repo } = parseRepositoryURL(issue.repository_url)
    return {
      owner,
      repo,
      number: issue.number,
    }
  })
}

const parseRepositoryURL = (s: string) => {
  const c = s.split('/')
  const repo = c.pop()
  const owner = c.pop()
  assert(owner, `invalid repository URL ${s}`)
  assert(repo, `invalid repository URL ${s}`)
  return { owner, repo }
}

const inferPullRequestFromContext = async (octokit: Octokit, context: Context): Promise<Issue[]> => {
  if (Number.isSafeInteger(context.issue.number)) {
    core.info(`inferred #${context.issue.number} from the current context`)
    return [
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        number: Number(context.issue.number),
      },
    ]
  }

  core.info(`list pull request(s) associated with ${context.sha}`)
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
