import assert from 'assert'
import axios from 'axios'
import type { Server } from 'http'
import { app } from '../src/app'

const port = app.get('port')
const appUrl = `http://${app.get('host')}:${port}`

describe('Cookie Authentication tests', () => {
  let server: Server
  let user: any

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

    // Create a test user
    const email = `cookie-test-${Date.now()}@test.com`
    const password = 'password'

    try {
      user = await app.service('users').create({
        email,
        password,
        role: 'viewer' // Adjust role if needed
      })
    } catch (e) {
      // If user exists, find it? No, clean slate is better but hard in parallel.
      // Assuming clean slate or unique email.
      console.error('Error creating user:', e)
    }
  })

  after(async () => {
    if (user) {
      await app.service('users').remove(user.id)
    }
    await app.teardown()
  })

  it('sets HttpOnly cookie on login via REST', async () => {
    const response = await axios.post(`${appUrl}/authentication`, {
      strategy: 'local',
      email: user.email,
      password: 'password'
    })

    assert.strictEqual(response.status, 201)

    const cookies = response.headers['set-cookie']
    assert.ok(cookies, 'Set-Cookie header should be present')

    const jwtCookie = cookies.find(c => c.startsWith('feathers-jwt='))
    assert.ok(jwtCookie, 'feathers-jwt cookie should be set')
    // console.log('Login Cookie:', jwtCookie)
    assert.ok(jwtCookie.toLowerCase().includes('httponly'), 'Cookie should be HttpOnly')
  })

  it('authenticates using cookie without Authorization header', async () => {
    // First login to get cookie
    const loginResponse = await axios.post(`${appUrl}/authentication`, {
      strategy: 'local',
      email: user.email,
      password: 'password'
    })

    const cookies = loginResponse.headers['set-cookie']
    const cookie = cookies?.find(c => c.startsWith('feathers-jwt='))

    // Extract cookie value for subsequent request
    // Axios doesn't automatically manage cookies in node unless configured with jar
    // We manually set Cookie header

    const cookieHeader = cookie ? cookie.split(';')[0] : ''

    const userResponse = await axios.get(`${appUrl}/users/${user.id}`, {
      headers: {
        Cookie: cookieHeader
        // No Authorization header
      }
    })

    assert.strictEqual(userResponse.status, 200)
    assert.strictEqual(userResponse.data.id, user.id)
  })

  it('clears cookie on logout via REST', async () => {
    // Login first
    const loginResponse = await axios.post(`${appUrl}/authentication`, {
      strategy: 'local',
      email: user.email,
      password: 'password'
    })

    const cookies = loginResponse.headers['set-cookie']
    const cookie = cookies?.find(c => c.startsWith('feathers-jwt='))
    const cookieHeader = cookie ? cookie.split(';')[0] : ''

    // Logout (DELETE /authentication/{id} where id is accessToken or strategy?)
    // Feathers logout is DELETE /authentication
    // But REST usually needs ID.
    // However, authentication service remove accepts null id?
    // Let's try DELETE /authentication with query param or just ID.
    // Actually, usually DELETE /authentication?accessToken=...
    // Or DELETE /authentication/<accessToken>

    const { accessToken } = loginResponse.data

    const logoutResponse = await axios.delete(`${appUrl}/authentication/${accessToken}`, {
      headers: {
        Cookie: cookieHeader
      }
    })

    assert.strictEqual(logoutResponse.status, 200)

    const logoutCookies = logoutResponse.headers['set-cookie']
    assert.ok(logoutCookies, 'Set-Cookie header should be present on logout')
    // console.log('Logout Cookies:', logoutCookies)

    // Koa sets expires to epoch for deletion
    const clearCookie = logoutCookies.find(c => c.startsWith('feathers-jwt=') && (c.includes('Max-Age=0') || c.toLowerCase().includes('expires=')))
    assert.ok(clearCookie, 'Cookie should be cleared (Max-Age=0 or Expires in past)')
  })
})
