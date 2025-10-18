import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import type { Context, Issue } from './github.js'

export const appendOrUpdateBody = async (issue: Issue, content: string, octokit: Octokit, context: Context) => {
  let currentBody = issue.body
  if (currentBody === undefined) {
    const { data: fetchedIssue } = await octokit.rest.issues.get({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
    })
    currentBody = fetchedIssue.body || ''
    core.info(`Fetched the body of ${issue.owner}/${issue.repo}#${issue.number}`)
  }

  const marker = `<!-- issues-action/${context.workflow}/${context.job} -->`
  const newBody = insertContentIntoBody(currentBody, content, marker)
  if (newBody === currentBody) {
    core.info(`The issue body is already desired state`)
    return
  }

  await octokit.rest.issues.update({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body: newBody,
  })
  core.info(`Updated the body of issue ${issue.owner}/${issue.repo}#${issue.number}`)
}

export const insertContentIntoBody = (body: string, content: string, marker: string): string => {
  // Typically marker is a comment, so wrap with new lines to prevent corruption of markdown
  marker = `\n${marker}\n`

  const elements = body.split(marker)
  if (elements.length === 1) {
    const firstBlock = elements[0]
    return [firstBlock, marker, content, marker].join('')
  }
  if (elements.length > 2) {
    const firstBlock = elements[0]
    elements.shift()
    elements.shift()
    return [firstBlock, marker, content, marker, ...elements].join('')
  }
  return body
}
