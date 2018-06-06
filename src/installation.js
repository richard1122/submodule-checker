const rp = require('request-promise-native')
const jwt = require('jsonwebtoken')
const path = require('path')
const cert = require('fs').readFileSync(path.join(__dirname, '..', 'keys/key.pem'))

const appId = process.env.APPID

function getJwt() {
  const payload = {
    iat: Math.floor(new Date() / 1000),
    exp: Math.floor(new Date() / 1000) + 60,
    iss: appId
  }
  return jwt.sign(payload, cert, {
    algorithm: 'RS256'
  })
}

function getToken(installationId) {
  const jwt = getJwt()
  return rp({
    uri: `https://api.github.com/installations/${installationId}/access_tokens`,
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github.machine-man-preview+json',
      'User-Agent': 'Submodule Checker'
    },
    method: 'POST',
    json: true
  })
}

async function request(token, endpoint, options = {}) {
  return await rp({
    uri: `https://api.github.com/${endpoint}`,
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.machine-man-preview+json',
      'User-Agent': 'Submodule Checker'
    },
    json: true
  })
}

module.exports = {
  getJwt, getToken, request
}
