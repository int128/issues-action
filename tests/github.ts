import * as github from '@actions/github'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  http.get('https://api.github.com/repos/int128/issues-action/commits/COMMIT_SHA/pulls', () =>
    HttpResponse.json([
      {
        number: 123,
      },
    ]),
  ),
  http.post('https://api.github.com/repos/int128/issues-action/issues/123/comments', () => HttpResponse.json({})),
  http.post('https://api.github.com/repos/int128/issues-action/issues/300/comments', () => HttpResponse.json({})),
  http.post('https://api.github.com/repos/int128/issues-action/issues/100/labels', () => HttpResponse.json([])),
  http.delete('https://api.github.com/repos/int128/issues-action/issues/200/labels/foo', () => HttpResponse.json([])),
  http.post('https://api.github.com/repos/int128/issues-action/issues/300/labels', () => HttpResponse.error()),
)

export const getOctokit = () => github.getOctokit('GITHUB_TOKEN', { request: { fetch } })
