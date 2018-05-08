const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const github = require('./installation')
const app = new Koa()

app.use(bodyParser())

app.use(async ctx => {
  const event = ctx.header['x-github-event']
  console.log(`${event} received.`)
  if (event !== 'push') {
    ctx.body = "skip"
    return
  }
  const body = ctx.request.body
  if (body === undefined) {
    ctx.status = 400
    return
  }
  const headCommit = body.head_commit.id
  const repo = body.repository.name
  const branch = /refs\/heads\/(.*)/.exec(body.ref)[1]
  const owner = body.repository.owner.name
  console.log(`ready to process ${repo}:${headCommit}`)

  const installationId = body.installation.id
  const token = (await github.getToken(installationId)).token
  const request = (endpoint, options) => {
    return github.request(token, endpoint, options)
  }

  try {
    let response = await request(`repos/${owner}/${repo}/contents/.submodule_checker.json`, {
      qs: {
        ref: headCommit
      },
      json: true
    })
    const content = JSON.parse(Buffer.from(response.content, 'base64').toString())
    console.log(content)
    ctx.body = "ok"

    await Promise.all(content.map(async it => {
      const submodule = await request(`repos/${owner}/${repo}/contents${it}`, {
        qs: {
          ref: headCommit
        }
      })
      if (submodule.type !== 'submodule') return
      const subRepo = /github.com\/(.*)(\.git)?/.exec(submodule.submodule_git_url)[1]
      const sha = submodule.sha
      console.log(`${subRepo}:${sha}`)
      const defaultBranch = (await request(`repos/${subRepo}`)).default_branch

      const compare = await request(`repos/${subRepo}/compare/${defaultBranch}...${sha}`)
      console.log(compare.status)

      let state, description
      if (compare.status === 'identical' || compare.status === 'behind') {
        state = 'success'
        description = `${subRepo}-${sha.substr(0, 7)} is on ${defaultBranch}`
      } else {
        state = 'failure'
        description = `${subRepo}-${sha.substr(0, 7)} is NOT on ${defaultBranch}`
      }
      return await request(`repos/${owner}/${repo}/statuses/${headCommit}`, {
        method: 'POST',
        body: {
          state: state,
          context: `CI/submodule-${subRepo}`,
          description: description
        },
      })
    }))
  } catch(e) {
  }
})

app.listen(3000)
