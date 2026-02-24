// Configuracao do servico de Onboarding
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { OnboardingService } from './onboarding.class'
import { onboardingDataValidator } from './onboarding.schema'

export const onboardingPath = 'onboarding'
export const onboardingMethods = ['find', 'create'] as const

export * from './onboarding.class'
export * from './onboarding.schema'

export const onboarding = (app: Application) => {
  app.use(onboardingPath, new OnboardingService(app), {
    methods: onboardingMethods,
    events: []
  })

  app.service(onboardingPath).hooks({
    around: {
      all: []
    },
    before: {
      all: [],
      find: [],
      create: [schemaHooks.validateData(onboardingDataValidator)]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [onboardingPath]: OnboardingService
  }
}
