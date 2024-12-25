import * as github from '@actions/github'
import { retry } from '@octokit/plugin-retry'
import { RequestError } from '@octokit/request-error'

export type Octokit = ReturnType<typeof github.getOctokit>

export const getOctokit = (token: string): Octokit => github.getOctokit(token, {}, retry)

export const catchStatusError = async <T>(status: number, promise: Promise<T>): Promise<T | undefined> => {
  try {
    return await promise
  } catch (e: unknown) {
    if (e instanceof RequestError && e.status === status) {
      return
    } else {
      throw e
    }
  }
}

export type Context = {
  sha: string
  repo: {
    owner: string
    repo: string
  }
  issue: {
    number?: number
  }
}

export const getContext = (): Context => github.context

export type Issue = {
  owner: string
  repo: string
  number: number
  body?: string // lazy
}
