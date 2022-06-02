import * as core from '@actions/core'
import * as github from '@actions/github'
import { Issue, Octokit } from './types'

export const appendOrUpdateBody = async (octokit: Octokit, issue: Issue, content: string) => {
  let fetchedBody = issue.body
  if (fetchedBody === undefined) {
    const { data: fetchedIssue } = await octokit.rest.issues.get({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
    })
    fetchedBody = fetchedIssue.body || ''
    core.info(`fetched the body of #${issue.number}`)
  }
  const body = computeBody(fetchedBody, content)
  await octokit.rest.issues.update({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body,
  })
  core.info(`updated the body of #${issue.number} as\n${fetchedBody}`)
}

const computeBody = (fetchedBody: string, content: string): string => {
  const marker = `<!-- issues-action/${github.context.workflow}/${github.context.job} -->`

  const elements = fetchedBody.split(marker)
  if (elements.length === 1) {
    return [elements[0], marker, content, marker].join('\n')
  }

  if (elements.length === 3) {
    return [elements[0], marker, content, marker, elements[2]].join('')
  }

  return fetchedBody
}
