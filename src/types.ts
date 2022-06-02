import { GitHub } from '@actions/github/lib/utils'

export type Octokit = InstanceType<typeof GitHub>

export type Issue = {
  owner: string
  repo: string
  number: number
  body?: string // lazy
}
