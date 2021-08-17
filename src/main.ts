import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    issueNumbers: parseIssueNumbers(core.getInput('issue-numbers', { required: true })),
    addLabels: core.getMultilineInput('add-labels'),
    removeLabels: core.getMultilineInput('remove-labels'),
    postComment: core.getInput('post-comment'),
    token: core.getInput('token', { required: true }),
  })
}

export const parseIssueNumbers = (s: string): number[] => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const a = JSON.parse(s)
  if (typeof a === 'number') {
    return [a]
  }
  if (Array.isArray(a)) {
    for (const e of a) {
      if (typeof e !== 'number') {
        throw new Error(`issue-numbers contains non-number ${JSON.stringify(e)}`)
      }
    }
    return a as number[]
  }
  throw new Error(`issue-numbers must be a number or array of numbers in JSON format`)
}

main().catch((error) => core.setFailed(error))
