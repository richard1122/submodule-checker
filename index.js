const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const rp = require('request-promise-native')
const app = new Koa()
const github = {
    "user-agent": "submodule-checker",
    Authorization: `token ${process.env.GH_TOKEN}`,
    Accept: 'application/vnd.github.mercy-preview+json'
}

const request = (endpoint, options) => {
  return rp({
    uri: `https://api.github.com/${endpoint}`,
    ...options,
    headers: {
      ...github
    }
  })
}

app.use(bodyParser())

app.use(async ctx => {
  const event = ctx.header['x-github-event']
  console.log(`${event} received.`)
  if (event != 'push') {
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
  const owner = body.repository.owner.name
  console.log(`ready to process ${repo}:${headCommit}`)

  try {
    const response = await request(`repos/${owner}/${repo}/contents/.submodule_checker.json`, {
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
        },
        json: true
      })
      if (submodule.type !== 'submodule') return
      const subRepo = submodule.submodule_git_url.split(':')[1].split('.')[0]
      const sha = submodule.sha
      console.log(`${subRepo}:${sha}`)
      const compare = await request(`repos/${subRepo}/compare/master...${sha}`, {
        json: true
      })
      console.log(compare.status)
      if (compare.status === 'identical' || compare.status === 'behind') {
        return await request(`/repos/${owner}/${repo}/statuses/${headCommit}`, {
          method: 'POST',
          form: {
            state: 'success',
            context: `CI/submodule-checker-${subRepo}`,
            description: `${subRepo}:${sha} is on master`
          }
        })
      } else {
        return await request(`/repos/${owner}/${repo}/statuses/${headCommit}`, {
          method: 'POST',
          form: {
            state: 'failure',
            context: `CI/submodule-checker-${subRepo}`,
            description: `${subRepo}:${sha} is NOT on master`
          }
        })
      }
    }))
  } catch(e) {
    await request(`/repos/${owner}/${repo}/statuses/${headCommit}`, {
      method: 'POST',
      form: {
        state: 'error',
        context: 'CI/submodule-checker',
        description: e.message || e
      }
    })
  }
})

app.listen(3000)
