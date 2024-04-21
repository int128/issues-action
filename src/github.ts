import * as github from '@actions/github'
import * as pluginRetry from '@octokit/plugin-retry'
import { Octokit } from './types.js'

export const getOctokit = (token: string): Octokit => github.getOctokit(token, undefined, pluginRetry.retry)
