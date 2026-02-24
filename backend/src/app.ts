// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'

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
app.use(cors())
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
