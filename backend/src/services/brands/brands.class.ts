// Servico de Brands (Marcas) - Classe
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type { Brand, BrandData, BrandPatch, BrandQuery } from './brands.schema'
import { defaultPrompts } from './brands.schema'

export type { Brand, BrandData, BrandPatch, BrandQuery }

export interface BrandParams extends KnexAdapterParams<BrandQuery> {}

// Interface para preview de prompt
export interface PromptPreviewParams {
  type: 'text' | 'image' | 'video'
  tema?: string
  plataforma?: string
  limite?: number
  estilo?: string
  cores?: string
  duracao?: number
}

// Servico de marcas com suporte a Knex
export class BrandService<ServiceParams extends Params = BrandParams> extends KnexService<
  Brand,
  BrandData,
  BrandParams,
  BrandPatch
> {
  // Metodo customizado para preview de prompt com variaveis substituidas
  async getPromptPreview(brandId: number, params: PromptPreviewParams): Promise<string> {
    const db = this.options.Model
    const brand = await db('brands').where('id', brandId).first()

    if (!brand) {
      throw new Error(`Brand ${brandId} nao encontrada`)
    }

    // Deserializar prompts se necessario
    let prompts = brand.prompts
    if (typeof prompts === 'string') {
      prompts = JSON.parse(prompts)
    }

    // Pegar o prompt do tipo solicitado ou usar o padrao
    let prompt = prompts?.[params.type] || defaultPrompts[params.type]

    // Substituir variaveis da marca
    prompt = prompt.replace('{nome_marca}', brand.name || '')
    prompt = prompt.replace('{tom_de_voz}', brand.toneOfVoice || '')

    // Deserializar cores se necessario
    let brandColors = brand.brandColors
    if (typeof brandColors === 'string') {
      brandColors = JSON.parse(brandColors)
    }
    prompt = prompt.replace('{cores}', Array.isArray(brandColors) ? brandColors.join(', ') : '')

    // Substituir variaveis passadas nos params
    prompt = prompt.replace('{tema}', params.tema || '')
    prompt = prompt.replace('{plataforma}', params.plataforma || '')
    prompt = prompt.replace('{limite}', params.limite?.toString() || '')
    prompt = prompt.replace('{estilo}', params.estilo || '')
    prompt = prompt.replace('{duracao}', params.duracao?.toString() || '')

    return prompt
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'brands'
  }
}
