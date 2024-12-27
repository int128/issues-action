import * as core from '@actions/core'
import { run } from './run.js'
import { getContext, getOctokit } from './github.js'

const main = async (): Promise<void> => {
  await run(
    {
      issueNumbers: parseIssueNumbers(core.getMultilineInput('issue-numbers')),
      context: core.getBooleanInput('context', { required: true }),
      dryRun: core.getBooleanInput('dry-run', { required: true }),
      addLabels: core.getMultilineInput('add-labels'),
      removeLabels: core.getMultilineInput('remove-labels'),
      postComment: core.getInput('post-comment'),
      appendOrUpdateBody: core.getInput('append-or-update-body'),
    },
    getContext(),
    getOctokit(core.getInput('token', { required: true })),
  )
}

export const parseIssueNumbers = (a: string[]): number[] =>
  a.map((e) => {
    const n = Number.parseInt(e)
    if (!Number.isSafeInteger(n)) {
      throw new Error(`invalid issue number: "${e}"`)
    }
    return n
  })

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
