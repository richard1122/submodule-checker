const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const fetch = require('node-fetch')
const app = new Koa()
const github = {
    "user-agent": "submodule-checker",
    Authorization: `token ${process.env.GH_TOKEN}`
}

const request = (endpoint, options) => {
  return fetch(`https://api.github.com/${endpoint}`, Object.assign(options, {
    headers: github
  }))
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

  const response = await request(`repos/${owner}/${repo}/contents/.submodule_checker.json?ref=${headCommit}`)
  console.log(response)

  const content = Buffer.from(response.data.content, 'base64').toString()
  console.log(content)
  ctx.body = "ok"
})
app.listen(3000)
