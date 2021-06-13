import * as core from '@actions/core'
import { Inputs, run } from './run'

const main = async (): Promise<void> => {
  try {
    await run(getInputs())
  } catch (error) {
    core.setFailed(error.message)
  }
}

const getInputs = (): Inputs => ({
  issueNumbers: parseIssueNumbers(core.getInput('issue-numbers', { required: true })),
  addLabels: core.getMultilineInput('add-labels'),
  removeLabels: core.getMultilineInput('remove-labels'),
  postComment: core.getInput('post-comment'),
  token: core.getInput('token', { required: true }),
})

export const parseIssueNumbers = (s: string): number[] => {
  const a = JSON.parse(s)
  if (typeof a === 'number') {
    return [a]
  }
  if (Array.isArray(a)) {
    for (const e of a) {
      if (typeof e !== 'number') {
        throw new Error(`issue-numbers contains non-number ${e}`)
      }
    }
    return a
  }
  throw new Error(`issue-numbers must be a number or array of numbers in JSON format`)
}

main()
