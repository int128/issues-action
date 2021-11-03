import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    issueNumbers: parseIssueNumbers(core.getMultilineInput('issue-numbers')),
    sha: core.getInput('sha'),
    addLabels: core.getMultilineInput('add-labels'),
    removeLabels: core.getMultilineInput('remove-labels'),
    postComment: core.getInput('post-comment'),
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

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)))
