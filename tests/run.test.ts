import { run } from '../src/run'
import { RequestError } from '@octokit/request-error'

const octokitMock = {
  rest: {
    issues: {
      addLabels: jest.fn(),
      removeLabel: jest.fn(),
      createComment: jest.fn(),
    },
    repos: {
      listPullRequestsAssociatedWithCommit: jest.fn(),
    },
  },
}
jest.mock('@actions/github', () => ({
  getOctokit: () => octokitMock,
  context: {
    repo: {
      owner: 'int128',
      repo: 'issues-action',
    },
    issue: {},
    sha: 'COMMIT_SHA',
  },
}))

test('no inputs', async () => {
  await run({
    issueNumbers: [],
    context: false,
    addLabels: [],
    removeLabels: [],
    postComment: '',
    appendOrUpdateBody: '',
    token: 'GITHUB_TOKEN',
  })
})

test('find pull request by sha', async () => {
  octokitMock.rest.repos.listPullRequestsAssociatedWithCommit.mockResolvedValueOnce({
    data: [{ number: 1 }],
  })
  octokitMock.rest.issues.createComment.mockResolvedValue({ data: [] })
  await run({
    issueNumbers: [],
    context: true,
    addLabels: [],
    removeLabels: [],
    postComment: 'foo',
    appendOrUpdateBody: '',
    token: 'GITHUB_TOKEN',
  })
  expect(octokitMock.rest.repos.listPullRequestsAssociatedWithCommit).toBeCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    commit_sha: 'COMMIT_SHA',
  })
  expect(octokitMock.rest.issues.createComment).toBeCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 1,
    body: 'foo',
  })
})

test('add a label', async () => {
  octokitMock.rest.issues.addLabels.mockResolvedValue({ data: [] })
  await run({
    issueNumbers: [100],
    context: false,
    addLabels: ['foo'],
    removeLabels: [],
    postComment: '',
    appendOrUpdateBody: '',
    token: 'GITHUB_TOKEN',
  })
  expect(octokitMock.rest.issues.addLabels).toBeCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 100,
    labels: ['foo'],
  })
})

test('remove a label', async () => {
  octokitMock.rest.issues.removeLabel.mockResolvedValue({ data: [] })
  await run({
    issueNumbers: [200],
    context: false,
    addLabels: [],
    removeLabels: ['foo'],
    postComment: '',
    appendOrUpdateBody: '',
    token: 'GITHUB_TOKEN',
  })
  expect(octokitMock.rest.issues.removeLabel).toBeCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 200,
    name: 'foo',
  })
})

test('remove non-existent label', async () => {
  octokitMock.rest.issues.removeLabel.mockRejectedValue(
    new RequestError('no label', 404, { request: { method: 'GET', url: 'https://api.github.com', headers: {} } })
  )
  await run({
    issueNumbers: [200],
    context: false,
    addLabels: [],
    removeLabels: ['foo'],
    postComment: '',
    appendOrUpdateBody: '',
    token: 'GITHUB_TOKEN',
  })
  expect(octokitMock.rest.issues.removeLabel).toBeCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 200,
    name: 'foo',
  })
})

test('post a comment', async () => {
  octokitMock.rest.issues.createComment.mockResolvedValue({ data: [] })
  await run({
    issueNumbers: [300],
    context: false,
    addLabels: [],
    removeLabels: [],
    postComment: 'foo',
    appendOrUpdateBody: '',
    token: 'GITHUB_TOKEN',
  })
  expect(octokitMock.rest.issues.createComment).toBeCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 300,
    body: 'foo',
  })
})

test('http error', async () => {
  octokitMock.rest.issues.addLabels.mockRejectedValue(
    new RequestError('no label', 500, { request: { method: 'GET', url: 'https://api.github.com', headers: {} } })
  )
  await expect(
    run({
      issueNumbers: [100],
      context: false,
      addLabels: ['foo'],
      removeLabels: [],
      postComment: '',
      appendOrUpdateBody: '',
      token: 'GITHUB_TOKEN',
    })
  ).rejects.toThrowError()
})
