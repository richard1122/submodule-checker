import { getToken, sendRequest } from './installation'

export default async function push (body) {
  const headCommit = body.head_commit.id
  const repo = body.repository.name
  const owner = body.repository.owner.name
  const installationId = body.installation.id
  const token = (await getToken(installationId)).token
  const request = (endpoint, options) => sendRequest(token, endpoint, options)
  try {
    const response = await request(`repos/${ owner }/${ repo }/contents/.submodule_checker.json`, {
      qs: { ref: headCommit },
      json: true,
    })
    const content = JSON.parse(Buffer.from(response.content, 'base64').toString())
    if (!Array.isArray(content))
      return
    await Promise.all(content.map(async it => {
      const submodule = await request(`repos/${ owner }/${ repo }/contents${ it }`, { qs: { ref: headCommit } })
      if (submodule.type !== 'submodule')
        return
      const subRepo = /github.com[/:](.*?)(\.git)?$/.exec(submodule.submodule_git_url)[1]
      const sha = submodule.sha
      const defaultBranch = (await request(`repos/${ subRepo }`)).default_branch
      let compare
      try {
        compare = (await request(`repos/${ subRepo }/compare/${ sha }...${ defaultBranch }`)).status
      } catch (e) {
        // Usually means more than 250 commit range, or no common ancestor.
        compare = 'unknown'
      }
      let state, description
      if (compare === 'identical' || compare === 'ahead') {
        state = 'success'
        description = `${ subRepo }-${ sha.substr(0, 7) } is on ${ defaultBranch } (${ compare })`
      } else {
        state = 'failure'
        description = `${ subRepo }-${ sha.substr(0, 7) } is NOT on ${ defaultBranch } (${ compare })`
      }
      return await request(`repos/${ owner }/${ repo }/statuses/${ headCommit }`, {
        method: 'POST',
        body: {
          state,
          context: subRepo,
          description,
          target_url: `https://github.com/${ subRepo }/compare/${ defaultBranch }...${ sha }`,
        },
      })
    }))
  } catch (e) {
    console.error(e)
  }
}
