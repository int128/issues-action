import * as github from '@actions/github'

export type Octokit = ReturnType<typeof github.getOctokit>

export type Issue = {
  owner: string
  repo: string
  number: number
  body?: string // lazy
}
