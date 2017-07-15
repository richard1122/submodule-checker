const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const GithubApi = require('github')
const app = new Koa()
const github = new GithubApi({
  // debug: true,
  headers: {
      "user-agent": "submodule-checker"
  },
})
console.log(process.env.GH_TOKEN)
github.authenticate({
  type: 'oauth',
  token: process.env.GH_TOKEN
})

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

  const response = await github.repos.getContent({
    owner,
    repo,
    path: '.submodule_checker.json',
    ref: headCommit
  })
  console.log(response)

  const content = Buffer.from(response.data.content, 'base64').toString()
  console.log(content)
  ctx.body = "ok"
})
app.listen(3000)
