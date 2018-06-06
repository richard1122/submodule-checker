import bl from 'bl'
import controller from './controller'
import crypto from 'crypto'

const secret = process.env.APPSECRET
const OK_RESPONSE = JSON.stringify({ success: true })

const verify = (sig, payload) => {
  const hash = crypto.createHmac('sha1', secret).update(payload)
    .digest()
  return crypto.timingSafeEqual(Buffer.from(sig.replace('sha1=', ''), 'hex'), hash)
}

// eslint-disable-next-line import/prefer-default-export
export function push (req, res) {
  const error = msg => {
    res.writeHead(400, { 'Content-Type': 'Application/json' })
    res.end(JSON.stringify({ error: msg }))
  }
  const sig = req.headers['x-hub-signature']
  const id = req.headers['x-github-delivery']
  const event = req.headers['x-github-event']
  if (!sig)
    return error('No signature found.')
  if (event !== 'push')
    return error('Wrong event type.')
  if (!id)
    return error('No delivery id found.')
  req.pipe(bl(async (err, data) => {
    if (err)
      return error(err.message)
    if (!verify(sig, data))
      return error('Github signature check failed.')
    let json
    try {
      json = JSON.parse(data.toString())
    } catch (e) {
      return error(e)
    }
    try {
      await controller(json)
      res.writeHead(200, { 'Content-Type': 'Application/json' })
      res.end(OK_RESPONSE)
    } catch (e) {
      console.error(e)
      return error(e)
    }
  }))
}
