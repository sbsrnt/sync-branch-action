const core = require('@actions/core')
const github = require('@actions/github')

const getPullsListByBranch = require('./get-pulls-list')
const createNewPullRequest = require('./create-new-pull')

async function run() {
  const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
  const SOURCE_BRANCH = core.getInput('SOURCE_BRANCH')
  const DESTINATION_BRANCH = core.getInput('DESTINATION_BRANCH')
  const PULL_REQUEST_TITLE = core.getInput('PULL_REQUEST_TITLE')
  const PULL_REQUEST_BODY = core.getInput('PULL_REQUEST_BODY')

  const octokit = github.getOctokit(GITHUB_TOKEN)
  const { repository } = github.context.payload

  core.info('Starting process to make a new pull request...')

  try {
    core.info('Verifying if required fields is setted.')
    if (!SOURCE_BRANCH || !DESTINATION_BRANCH) {
      throw new Error('You need to enter a valid value in the "SOURCE_BRANCH" and "DESTINATION_BRANCH" fields.')
    }

    const repo = repository.name
    const owner = repository.owner.login

    const title = PULL_REQUEST_TITLE || `
      update: ${DESTINATION_BRANCH} to ${SOURCE_BRANCH}
    `
    const body = PULL_REQUEST_BODY || `
      This is an automatic Pull Request to keep ${DESTINATION_BRANCH} up to date with ${SOURCE_BRANCH}! 🔄
    `

    const openPullRequest = await getPullsListByBranch(octokit, {
      owner,
      repo,
      head: SOURCE_BRANCH,
    })

    if (!openPullRequest) {
      const params = {
        owner,
        repo,
        body,
        title,
        head: SOURCE_BRANCH,
        base: DESTINATION_BRANCH,
      }

      await createNewPullRequest(octokit, params)
      return
    }

    core.info(`A pull request has already been opened to update the ${DESTINATION_BRANCH} branch`)
    core.setOutput("PULL_REQUEST_URL", openPullRequest.url)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run();