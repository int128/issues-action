import * as core from '@actions/core'
import { run } from './run.js'

const main = async (): Promise<void> => {
  await run({
    issueNumbers: parseIssueNumbers(core.getMultilineInput('issue-numbers')),
    context: core.getBooleanInput('context', { required: true }),
    addLabels: core.getMultilineInput('add-labels'),
    removeLabels: core.getMultilineInput('remove-labels'),
    postComment: core.getInput('post-comment'),
    appendOrUpdateBody: core.getInput('append-or-update-body'),
    token: core.getInput('token', { required: true }),
  })
}

export const parseIssueNumbers = (a: string[]): number[] =>
  a.map((e) => {
    const n = Number.parseInt(e)
    if (!Number.isSafeInteger(n)) {
      throw new Error(`"${e}" (${n}) is not issue number`)
    }
    return n
  })

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
