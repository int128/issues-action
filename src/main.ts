import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    issueNumbers: parseIssueNumbers(core.getMultilineInput('issue-numbers')),
    addLabels: core.getMultilineInput('add-labels'),
    removeLabels: core.getMultilineInput('remove-labels'),
    postComment: core.getInput('post-comment'),
    token: core.getInput('token', { required: true }),
  })
}

export const parseIssueNumbers = (a: string[]): number[] => a.map((e) => parseInt(e))

main().catch((error) => core.setFailed(error))
