import assert from 'assert'
import axios from 'axios'
import type { Server } from 'http'
import { app } from '../src/app'

const port = app.get('port')
const appUrl = `http://${app.get('host')}:${port}`

describe('Security tests', () => {
  let server: Server

  before(async () => {
    try {
      server = await app.listen(port)
    } catch (e: any) {
      if (e.code === 'EADDRINUSE') {
        console.log('Server already running')
      } else {
        throw e
      }
    }
  })

  after(async () => {
    await app.teardown()
  })

  // Helper to make requests without throwing on error status
  const client = axios.create({
    validateStatus: () => true
  })

  it('has security headers', async () => {
    // We expect 404 because index.html is missing, but headers should be there
    const { headers } = await client.get(appUrl)
    assert.ok(headers['x-dns-prefetch-control'])
    assert.ok(headers['x-frame-options'])
    // Helmet default HSTS might change, check for presence and directives
    assert.ok(headers['strict-transport-security'])
    assert.ok(headers['strict-transport-security'].includes('max-age='))
    assert.ok(headers['strict-transport-security'].includes('includeSubDomains'))
    assert.ok(headers['x-download-options'])
    assert.ok(headers['x-content-type-options'])
    assert.ok(headers['x-permitted-cross-domain-policies'])
    assert.ok(headers['referrer-policy'])
  })

  it('has rate limiting headers', async () => {
    const { headers } = await client.get(appUrl)
    assert.ok(headers['rate-limit-remaining'])
    assert.ok(headers['rate-limit-reset'])
    assert.ok(headers['rate-limit-total'])
  })

  it('validates CORS', async () => {
    // Allowed origin
    const allowedOrigin = 'http://localhost:3030'
    const response = await client.get(appUrl, {
      headers: { Origin: allowedOrigin }
    })
    assert.strictEqual(response.headers['access-control-allow-origin'], allowedOrigin)

    // Disallowed origin
    const maliciousOrigin = 'http://malicious-site.com'
    const r2 = await client.get(appUrl, {
      headers: { Origin: maliciousOrigin }
    })

    // Should NOT return the malicious origin in ACAO header
    // It might return allowedOrigin[0] (http://localhost:3030) or nothing/null depending on implementation
    const acao = r2.headers['access-control-allow-origin']
    assert.notStrictEqual(acao, maliciousOrigin)
  })

  // Move this to the end because it consumes rate limit quota
  it('enforces rate limiting', async function () {
    this.timeout(20000)

    const requests = []
    // Make > 100 requests to trigger rate limit (configured max 100)
    for (let i = 0; i < 110; i++) {
      requests.push(client.get(appUrl))
    }

    const responses = await Promise.all(requests)
    const tooManyRequests = responses.filter(r => r.status === 429)

    assert.ok(tooManyRequests.length > 0, `Should have received 429 Too Many Requests. Got ${tooManyRequests.length}`)
  })
})
