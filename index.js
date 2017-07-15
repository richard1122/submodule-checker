const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const GithubApi = require('github')
const app = new Koa()
const github = new GithubApi({
  debug: true,
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
  const body = ctx.request.body
  if (body === undefined) {
    ctx.status = 400
  }
  const headCommit = body.head_commit.id
  const repo = body.repository.full_name
  console.log(body)
  ctx.body = 'ok'
})
app.listen(3000)
