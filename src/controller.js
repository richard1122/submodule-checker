const github = require('./installation')
const utils = require('./util')

exports.push = async body => {
  const headCommit = body.head_commit.id
  const repo = body.repository.name
  const owner = body.repository.owner.name

  const installationId = body.installation.id
  const token = (await github.getToken(installationId)).token
  const request = (endpoint, options) => {
    return github.request(token, endpoint, options)
  }

  try {
    utils.doSubmoduleCheck(owner, repo, headCommit, request)
  } catch(e) {
    console.error(e)
  }
}
