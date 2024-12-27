import { Context } from '../src/github.js'
import { run } from '../src/run.js'
import { getOctokit, server } from './github.js'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const githubContext: Context = {
  repo: {
    owner: 'int128',
    repo: 'issues-action',
  },
  issue: {},
  sha: 'COMMIT_SHA',
}

test('no inputs', async () => {
  await run(
    {
      issueNumbers: [],
      context: false,
      dryRun: false,
      addLabels: [],
      removeLabels: [],
      postComment: '',
      appendOrUpdateBody: '',
    },
    githubContext,
    getOctokit(),
  )
})

test('find pull request by sha', async () => {
  await run(
    {
      issueNumbers: [],
      context: true,
      dryRun: false,
      addLabels: [],
      removeLabels: [],
      postComment: 'foo',
      appendOrUpdateBody: '',
    },
    githubContext,
    getOctokit(),
  )
})

test('add a label', async () => {
  await run(
    {
      issueNumbers: [100],
      context: false,
      dryRun: false,
      addLabels: ['foo'],
      removeLabels: [],
      postComment: '',
      appendOrUpdateBody: '',
    },
    githubContext,
    getOctokit(),
  )
})

test('remove a label', async () => {
  await run(
    {
      issueNumbers: [200],
      context: false,
      dryRun: false,
      addLabels: [],
      removeLabels: ['foo'],
      postComment: '',
      appendOrUpdateBody: '',
    },
    githubContext,
    getOctokit(),
  )
})

test('remove non-existent label', async () => {
  await run(
    {
      issueNumbers: [200],
      context: false,
      dryRun: false,
      addLabels: [],
      removeLabels: ['foo'],
      postComment: '',
      appendOrUpdateBody: '',
    },
    githubContext,
    getOctokit(),
  )
})

test('post a comment', async () => {
  await run(
    {
      issueNumbers: [300],
      context: false,
      dryRun: false,
      addLabels: [],
      removeLabels: [],
      postComment: 'foo',
      appendOrUpdateBody: '',
    },
    githubContext,
    getOctokit(),
  )
})

test('http error', async () => {
  await expect(
    run(
      {
        issueNumbers: [300],
        context: false,
        dryRun: false,
        addLabels: ['foo'],
        removeLabels: [],
        postComment: '',
        appendOrUpdateBody: '',
      },
      githubContext,
      getOctokit(),
    ),
  ).rejects.toThrow()
})
