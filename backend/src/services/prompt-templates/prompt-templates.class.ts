// Classe do servico de Prompt Templates
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type {
  PromptTemplate,
  PromptTemplateData,
  PromptTemplatePatch,
  PromptTemplateQuery
} from './prompt-templates.schema'

export type { PromptTemplate, PromptTemplateData, PromptTemplatePatch, PromptTemplateQuery }

export interface PromptTemplatesParams extends KnexAdapterParams<PromptTemplateQuery> {}

// Templates padrao de prompts
export const DEFAULT_PROMPT_TEMPLATES: PromptTemplateData[] = [
  {
    name: 'Geracao de Post Padrao',
    type: 'text',
    template: `Voce e um especialista em social media criando conteudo para {marca}.
Tom de voz: {tom_de_voz}
Valores da marca: {valores}
Publico-alvo: {publico_alvo}
Plataforma: {plataforma}
Limite de caracteres: {limite_caracteres}

Crie um post sobre: {tema}

Instrucoes:
- Seja autentico e envolvente
- Use linguagem adequada ao publico
- Respeite o limite de caracteres
- Inclua call-to-action quando apropriado`,
    description: 'Template padrao para geracao de posts de texto',
    isDefault: true
  },
  {
    name: 'Geracao de Legenda para Imagem',
    type: 'image',
    template: `Crie uma legenda para uma imagem sobre {tema} para {marca}.
Plataforma: {plataforma}
Tom: {tom_de_voz}
Limite: {limite_caracteres} caracteres

A legenda deve complementar a imagem e engajar o publico.`,
    description: 'Template para legendas de imagens',
    isDefault: true
  },
  {
    name: 'Script de Video Curto',
    type: 'video',
    template: `Crie um roteiro de video curto (15-60 segundos) sobre {tema} para {marca}.
Plataforma: {plataforma}
Tom: {tom_de_voz}

Estrutura:
1. Gancho inicial (3 segundos)
2. Conteudo principal
3. Call-to-action final

O roteiro deve ser dinamico e adequado para videos verticais.`,
    description: 'Template para scripts de videos curtos (Reels, TikTok, Shorts)',
    isDefault: true
  }
]

export class PromptTemplatesService<ServiceParams extends Params = PromptTemplatesParams> extends KnexService<
  PromptTemplate,
  PromptTemplateData,
  PromptTemplatesParams,
  PromptTemplatePatch
> {
  app: Application

  constructor(options: KnexAdapterOptions, app: Application) {
    super(options)
    this.app = app
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'prompt_templates'
  }
}
