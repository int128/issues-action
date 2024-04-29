import { run } from '../src/run.js'

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

jest.mock('../src/github', () => ({
  getOctokit: () => octokitMock,
}))

jest.mock('@actions/github', () => ({
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
  expect(octokitMock.rest.repos.listPullRequestsAssociatedWithCommit).toHaveBeenCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    commit_sha: 'COMMIT_SHA',
  })
  expect(octokitMock.rest.issues.createComment).toHaveBeenCalledWith({
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
  expect(octokitMock.rest.issues.addLabels).toHaveBeenCalledWith({
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
  expect(octokitMock.rest.issues.removeLabel).toHaveBeenCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 200,
    name: 'foo',
  })
})

test('remove non-existent label', async () => {
  octokitMock.rest.issues.removeLabel.mockRejectedValue(
    { status: 404, message: 'Label does not exist'}
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
  expect(octokitMock.rest.issues.removeLabel).toHaveBeenCalledWith({
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
  expect(octokitMock.rest.issues.createComment).toHaveBeenCalledWith({
    owner: 'int128',
    repo: 'issues-action',
    issue_number: 300,
    body: 'foo',
  })
})

test('http error', async () => {
  octokitMock.rest.issues.addLabels.mockRejectedValue({ status: 500, message: 'Internal Server Error' })
  await expect(
    run({
      issueNumbers: [100],
      context: false,
      addLabels: ['foo'],
      removeLabels: [],
      postComment: '',
      appendOrUpdateBody: '',
      token: 'GITHUB_TOKEN',
    }),
  ).rejects.toThrow()
})
