const controllers = require('./controller')
const crypto = require('crypto')
const bl = require('bl')
const runtimeConfig = require('cloud-functions-runtime-config')

let secret = ''
runtimeConfig.getVariable('submodule-checker', 'APPSECRET').then((value) => secret = value).catch(console.error)
const OK_RESPONSE = JSON.stringify({ success: true })

const verify = (sig, payload) => {
  const hash = crypto.createHmac('sha1', secret).update(payload).digest()
  console.log(sig, hash.toString('hex'))
  return crypto.timingSafeEqual(Buffer.from(sig.replace('sha1=', ''), 'hex'), hash)
}

exports.push = async (req, res) => {
  const error = (msg) => {
    res.writeHead(400, {
      'Content-Type': 'Application/json'
    })
    res.end(JSON.stringify({
      error: msg
    }))
  }

  const sig = req.headers['x-hub-signature']
  const id = req.headers['x-github-delivery']
  const event = req.headers['x-github-event']

  if (!sig) return error('No signature found.')
  if (event !== 'push') return error('Wrong event type.')
  if (!id) return error('No delivery id found.')

  if (!verify(sig, req.rawBody)) return error('Github signature check failed.')
  const json = req.body
  try {
    await controllers.push(json)
    res.writeHead(200, {
      'Content-Type': 'Application/json'
    })
    res.end(OK_RESPONSE)
  } catch (e) {
    console.error(e)
    return error(e)
  }
}