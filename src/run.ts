import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { RequestError } from '@octokit/request-error'

type Octokit = InstanceType<typeof GitHub>

export type Inputs = {
  issueNumbers: number[]
  sha: string
  addLabels: string[]
  removeLabels: string[]
  postComment: string
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const octokit = github.getOctokit(inputs.token)
  const { owner, repo } = github.context.repo
  const issueNumbers = [...inputs.issueNumbers]

  if (inputs.sha) {
    core.info(`list pull request(s) associated with ${inputs.sha}`)
    const pulls = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: inputs.sha,
    })
    issueNumbers.push(...pulls.data.map((pr) => pr.number))
  }

  for (const issue_number of issueNumbers) {
    core.startGroup(`processing #${issue_number}`)
    await processIssue(octokit, {
      ...inputs,
      owner,
      repo,
      issue_number,
    })
    core.endGroup()
  }
}

type ProcessIssueRequest = {
  owner: string
  repo: string
  issue_number: number
  addLabels: string[]
  removeLabels: string[]
  postComment: string
}

const processIssue = async (octokit: Octokit, r: ProcessIssueRequest): Promise<void> => {
  const { owner, repo, issue_number } = r

  if (r.addLabels.length > 0) {
    const { data: added } = await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: r.addLabels,
    })
    core.info(`added label(s) to #${issue_number}: ${added.map((label) => label.name).join(', ')}`)
  }

  for (const labelName of r.removeLabels) {
    try {
      const { data: removed } = await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number,
        name: labelName,
      })
      core.info(`removed label ${labelName} from #${issue_number}: ${removed.map((label) => label.name).join(', ')}`)
    } catch (error) {
      if (error instanceof RequestError && error.status === 404) {
        core.warning(`could not remove label ${labelName} from #${issue_number}: ${error.message}`)
        continue
      }
      throw error
    }
  }

  if (r.postComment !== '') {
    const { data: created } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body: r.postComment,
    })
    core.info(`create a comment to #${issue_number}: ${created.html_url}`)
  }
}
