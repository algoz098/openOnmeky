// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import helmet from 'koa-helmet'
import rateLimit from 'koa-ratelimit'

import { configurationValidator } from './configuration'
import type { Application } from './declarations'
import { logError } from './hooks/log-error'
import { sqlite } from './sqlite'
import { authentication } from './authentication'
import { services } from './services/index'
import { channels } from './channels'
import { logger } from './logger'

// JWT secret padrao inseguro - usado apenas para desenvolvimento
const INSECURE_JWT_SECRET = 'QFaZO1iwev8qoCFi03ut70u2v2qlia37'

const app: Application = koa(feathers())

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))

// Verificacao de seguranca: alertar se o JWT secret padrao estiver sendo usado em producao
const jwtSecret = app.get('authentication')?.secret
const isProduction = process.env.NODE_ENV === 'production'

if (jwtSecret === INSECURE_JWT_SECRET) {
  if (isProduction) {
    logger.error('ERRO DE SEGURANCA: JWT secret padrao esta sendo usado em producao!')
    logger.error('Configure a variavel de ambiente FEATHERS_SECRET com um valor seguro.')
    process.exit(1)
  } else {
    logger.warn('AVISO: JWT secret padrao em uso. Configure FEATHERS_SECRET para producao.')
  }
}

// Set up Koa middleware
app.use(helmet())
app.use(
  cors({
    origin: (ctx) => {
      const origin = ctx.request.header.origin
      const allowedOrigins = app.get('origins')
      // Se a origem estiver na lista permitida, retorna ela
      if (Array.isArray(allowedOrigins) && origin && allowedOrigins.includes(origin)) {
        return origin
      }
      // Se nao, retorna a primeira origem permitida (geralmente o proprio backend ou frontend principal)
      return Array.isArray(allowedOrigins) ? allowedOrigins[0] : '*'
    }
  })
)

// Rate limiting
app.use(
  rateLimit({
    driver: 'memory',
    db: new Map(),
    duration: 60000,
    errorMessage: 'Muitas requisicoes, por favor tente novamente mais tarde.',
    id: (ctx) => ctx.ip,
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total'
    },
    max: 100,
    disableHeader: false
  })
)

// Middleware para gerenciar cookies HttpOnly
app.use(async (ctx, next) => {
  // 1. Extrair token do cookie para autenticacao
  const { authorization } = ctx.request.header
  const cookieToken = ctx.cookies.get('feathers-jwt')

  if (!authorization && cookieToken) {
    ctx.request.header.authorization = `Bearer ${cookieToken}`
  }

  await next()

  // 2. Definir cookie no login bem-sucedido (POST /authentication)
  if (ctx.method === 'POST' && ctx.path === '/authentication' && ctx.status === 201) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = ctx.body as any
    if (body && body.accessToken) {
      ctx.cookies.set('feathers-jwt', body.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
      })
    }
  }

  // 3. Limpar cookie no logout (DELETE /authentication)
  if (ctx.method === 'DELETE' && ctx.path.startsWith('/authentication') && ctx.status === 200) {
    ctx.cookies.set('feathers-jwt', null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0 // Expira imediatamente
    })
  }
})

app.use(serveStatic(app.get('public')))
app.use(errorHandler())
app.use(parseAuthentication())
app.use(
  bodyParser({
    multipart: true,
    formidable: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true
    }
  })
)

// Middleware para passar arquivos do multipart para ctx.feathers
app.use(async (ctx, next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = (ctx.request as any).files
  if (files) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.feathers = { ...ctx.feathers, files } as any
  }
  await next()
})

// Configure services and transports
app.configure(rest())
app.configure(
  socketio({
    cors: {
      origin: app.get('origins')
    }
  })
)
app.configure(sqlite)
app.configure(authentication)
app.configure(services)
app.configure(channels)

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError]
  },
  before: {},
  after: {},
  error: {}
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: []
})

export { app }
