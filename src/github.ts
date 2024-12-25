import * as github from '@actions/github'
import { retry } from '@octokit/plugin-retry'

export type Octokit = ReturnType<typeof github.getOctokit>

export const getOctokit = (token: string): Octokit => github.getOctokit(token, {}, retry)

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
