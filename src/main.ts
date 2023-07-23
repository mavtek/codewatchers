import * as core from '@actions/core'
import Codeowners from 'codeowners'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const filename = core.getInput('codewatchers-filename')
    core.debug(`Using ${filename} for setting assignees`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const watchers = new Codeowners(undefined, filename)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    core.debug(`Watchers: ${JSON.stringify((watchers as any).ownerEntries)}`)

    const githubToken = core.getInput('github-token', {required: true})
    const octokit = github.getOctokit(githubToken)
    let changedFiles = undefined
    // if (github.context.eventName === 'push') {
    //   changedFiles = await octokit.rest.repos.getCommit({
    //     ...github.context.repo,
    //     ref: github.context.sha,
    //     per_page: 100
    //   })
    // } else
    if (github.context.eventName === 'pull_request') {
      changedFiles = await octokit.rest.pulls.listFiles({
        ...github.context.repo,
        pull_number: github.context.issue.number,
        per_page: 100
      })
    } else {
      core.debug(`No changed files - can't handle ${github.context.eventName}`)
      return
    }
    if (changedFiles) {
      core.debug(
        `Changed files: ${JSON.stringify(
          changedFiles.data.map(file => file.filename)
        )}`
      )

      const watchersForChangedFiles = changedFiles.data.flatMap(file =>
        watchers.getOwner(file.filename)
      )
      const uniqueWatchers = [...new Set(watchersForChangedFiles)]
      core.debug(`Filtered watchers: ${JSON.stringify(uniqueWatchers)}`)

      // Set assignees
      const mappings = new Map(
        core
          .getMultilineInput('github-user-mappings')
          .map(line => line.split(':') as [string, undefined])
      )
      core.debug(`Mappings: ${JSON.stringify(Object.fromEntries(mappings))}`)

      const mappedAssignees = uniqueWatchers.map(
        watcher => mappings.get(watcher) ?? watcher
      )
      core.debug(`Mapped assignees: ${JSON.stringify(mappedAssignees)}`)
      core.setOutput('assignees', mappedAssignees.join(',') ?? '')

      let addAssignees = true
      if (core.getInput('add-assignees', {required: true}) === 'false') {
        addAssignees = false
      }
      if (addAssignees) {
        await octokit.rest.issues.addAssignees({
          ...github.context.repo,
          issue_number: github.context.issue.number,
          assignees: mappedAssignees
        })
      }
    } else {
      core.debug(`No changed files - can't handle ${github.context.eventName}`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
