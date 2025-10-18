import * as core from '@actions/core'
import { getContext, getOctokit } from './github.js'
import { run } from './run.js'

const main = async (): Promise<void> => {
  await run(
    {
      issueNumbers: new Set(parseIssueNumbers(core.getMultilineInput('issue-numbers'))),
      context: core.getBooleanInput('context', { required: true }),
      dryRun: core.getBooleanInput('dry-run', { required: true }),
      addLabels: new Set(core.getMultilineInput('add-labels')),
      removeLabels: new Set(core.getMultilineInput('remove-labels')),
      postComment: core.getInput('post-comment'),
      appendOrUpdateBody: core.getInput('append-or-update-body'),
    },
    getOctokit(),
    await getContext(),
  )
}

export const parseIssueNumbers = (a: string[]): number[] =>
  a.map((e) => {
    const n = Number.parseInt(e, 10)
    if (!Number.isSafeInteger(n)) {
      throw new Error(`invalid issue number: "${e}"`)
    }
    return n
  })

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
