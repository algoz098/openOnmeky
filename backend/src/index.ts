import { app } from './app'
import { logger } from './logger'

const port = app.get('port')
const host = app.get('host')

process.on('unhandledRejection', reason => logger.error('Unhandled Rejection %O', reason))

const startServer = async () => {
  try {
    // Executar migracoes automaticamente antes de iniciar
    const db = app.get('sqliteClient')
    logger.info('Running database migrations...')
    await db.migrate.latest()
    logger.info('Database migrations completed')

    // Iniciar servidor
    await app.listen(port)
    logger.info(`Feathers app listening on http://${host}:${port}`)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
