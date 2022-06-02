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

  const marker = `<!-- issues-action/${github.context.workflow}/${github.context.job} -->`
  const body = computeBody(fetchedBody, content, marker)
  if (body === fetchedBody) {
    core.info(`issue body is already desired state`)
    return
  }

  await octokit.rest.issues.update({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body,
  })
  core.info(`updated the body of #${issue.number}`)
}

export const computeBody = (fetchedBody: string, content: string, marker: string): string => {
  // typically marker is a comment, so wrap with new lines to prevent corruption of markdown
  marker = `\n${marker}\n`

  const elements = fetchedBody.split(marker)
  if (elements.length === 1) {
    return [elements[0], marker, content, marker].join('')
  }
  if (elements.length > 2) {
    const first = elements[0]
    elements.shift()
    elements.shift()
    return [first, marker, content, marker, ...elements].join('')
  }
  return fetchedBody
}
