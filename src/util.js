async function doSubmoduleCheck(owner, repo, headCommit, sendRequest) {
  const configuration = await getConfiguration(owner, repo, headCommit, sendRequest)
  const promises = configuration.map(it => requestPath(owner, repo, headCommit, sendRequest, it))
  const result = (await Promise.all(promises.map(it => it.catch(it => it)))).filter(it => it instanceof Error)
  return result.length ? Promise.reject(result) : Promise.resolve()
}

async function getConfiguration(owner, repo, headCommit, sendRequest) {
  let response = await sendRequest(`repos/${owner}/${repo}/contents/.submodule_checker.json`, {
    qs: {
      ref: headCommit
    },
    json: true
  })
  const content = JSON.parse(Buffer.from(response.content, 'base64').toString())
  if (!Array.isArray(content)) {
    throw new Error('Wrong .submodule_checker.json file.')
  }
  return content
}

async function requestPath(owner, repo, headCommit, sendRequest, it) {
  const submodule = await sendRequest(`repos/${owner}/${repo}/contents${it}`, {
    qs: {
      ref: headCommit
    }
  })
  if (submodule.type !== 'submodule') return
  const subRepo = /github.com[/:](.*?)(\.git)?$/.exec(submodule.submodule_git_url)[1]
  const sha = submodule.sha
  const defaultBranch = (await sendRequest(`repos/${subRepo}`)).default_branch

  let compareResult
  try {
    compareResult = (await sendRequest(`repos/${subRepo}/compare/${sha}...${defaultBranch}`)).status
  } catch (e) {
    // Usually means more than 250 commit range, or no common ancestor.
    compareResult = 'unknown'
  }

  const success = compareResult === 'identical' || compareResult === 'ahead'
  const state = success ? 'success' : 'failure'
  const description = `${subRepo}-${sha.substr(0, 7)} is ${success ? '' : 'NOT'} on ${defaultBranch} (${compareResult})`

  return await sendRequest(`repos/${owner}/${repo}/statuses/${headCommit}`, {
    method: 'POST',
    body: {
      state: state,
      context: subRepo,
      description: description,
      target_url: `https://github.com/${subRepo}/compare/${defaultBranch}...${sha}`
    },
  })
}

module.exports = {
  doSubmoduleCheck
}
