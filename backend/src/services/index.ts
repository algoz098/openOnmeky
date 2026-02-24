import { user } from './users/users'
import { brand } from './brands/brands'
import { aiProviders } from './ai-providers/ai-providers'
import { aiModels } from './ai-models/ai-models'
import { ai } from './ai/ai'
import { aiGenerationLogs } from './ai-generation-logs/ai-generation-logs'
import { aiRequests } from './ai-requests/ai-requests'
import { posts } from './posts/posts'
import { postVersions } from './post-versions/post-versions'
import { deriveImage } from './posts/derive-image.class'
import { regenerateSlide } from './posts/regenerate-slide.class'
import { roles } from './roles/roles'
import { platforms } from './platforms/platforms'
import { promptTemplates } from './prompt-templates/prompt-templates'
import { system } from './system/system'
import { seed } from './seed/seed'
import { onboarding } from './onboarding/onboarding'
import { settings } from './settings/settings'
import { medias } from './medias/medias'
// Servicos de dados normalizados
import { postSlides } from './post-slides/post-slides'
import { brandColors } from './brand-colors/brand-colors'
import { brandValues } from './brand-values/brand-values'
import { brandAiConfigs } from './brand-ai-configs/brand-ai-configs'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  // Registra servicos base
  app.configure(user)
  app.configure(brand)

  // Registra servico de settings primeiro (necessario para carregar configuracoes de IA)
  app.configure(settings)

  // Registra servicos de IA
  app.configure(aiProviders)
  app.configure(aiModels)
  app.configure(ai)
  app.configure(aiGenerationLogs)
  app.configure(aiRequests) // Servico de auditoria de requests de IA (somente leitura)

  // Registra servicos de conteudo
  app.configure(posts)
  app.configure(postVersions) // Servico de versoes de posts
  app.configure(deriveImage) // Servico de derivacao de imagens em diferentes proporcoes
  app.configure(regenerateSlide) // Servico de regeneracao de imagem de slide individual
  app.configure(medias)

  // Registra servicos de sistema
  app.configure(roles)
  app.configure(platforms)
  app.configure(promptTemplates)
  app.configure(system)
  app.configure(seed)
  app.configure(onboarding)

  // Registra servicos de dados normalizados
  app.configure(postSlides)
  app.configure(brandColors)
  app.configure(brandValues)
  app.configure(brandAiConfigs)
}
