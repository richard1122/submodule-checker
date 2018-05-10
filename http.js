const http = require('http')
const crypto = require('crypto')
const bl = require('bl')

const OK_RESPONSE = JSON.stringify({ success: true })

module.exports = (secret, handler) => {

  const verify = (sig, payload) => {
    const hash = crypto.createHmac('sha1', secret).update(payload).digest()
    return crypto.timingSafeEqual(Buffer.from(sig.replace('sha1=', ''), 'hex'), hash)
  }

  http.createServer((req, res) => {
    const error = (msg) => {
      res.writeHead(400, {
        'Content-Type': 'Application/json'
      })
      res.end(JSON.stringify({
        error: msg
      }))

      handler.emit('error', new Error(msg))
    }

    if (req.url === '/healthz') {
      res.writeHead(204)
      return res.end()
    }

    const sig = req.headers['x-hub-signature']
    const id = req.headers['x-github-delivery']
    const event = req.headers['x-github-event']

    if (!sig) return error('No signature found.')
    if (event !== 'push') return error('Wrong event type.')
    if (!id) return error('No delivery id found.')

    req.pipe(bl((err, data) => {
      if (err) return error(err.message)
      if (!verify(sig, data)) return error('Github signature check failed.')
      let json
      try { json = JSON.parse(data.toString()) } catch(e) { return error(e) }
      res.writeHead(200, {
        'Content-Type': 'Application/json'
      })
      res.end(OK_RESPONSE)
      handler.emit('push', json)
    }))

  }).listen(7777)
}
