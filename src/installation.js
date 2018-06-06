import { join } from 'path'
import { readFileSync } from 'fs'
import rp from 'request-promise-native'
import { sign } from 'jsonwebtoken'

const cert = readFileSync(join(__dirname, '..', 'keys/key.pem'))
const appId = process.env.APPID

export function getJwt () {
  const payload = {
    iat: Math.floor(new Date() / 1000),
    exp: Math.floor(new Date() / 1000) + 60,
    iss: appId,
  }
  return sign(payload, cert, { algorithm: 'RS256' })
}

export function getToken (installationId) {
  const jwt = getJwt()
  return rp({
    uri: `https://api.github.com/installations/${ installationId }/access_tokens`,
    headers: {
      Authorization: `Bearer ${ jwt }`,
      Accept: 'application/vnd.github.machine-man-preview+json',
      'User-Agent': 'Submodule Checker',
    },
    method: 'POST',
    json: true,
  })
}

export async function sendRequest (token, endpoint, options = {}) {
  return await rp({
    uri: `https://api.github.com/${ endpoint }`,
    ...options,
    headers: {
      Authorization: `token ${ token }`,
      Accept: 'application/vnd.github.machine-man-preview+json',
      'User-Agent': 'Submodule Checker',
    },
    json: true,
  })
}
