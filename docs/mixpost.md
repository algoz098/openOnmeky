# Mixpost - Alternativa Self-Hosted

## Visao Geral

Mixpost e uma plataforma self-hosted de gerenciamento de redes sociais, construida em Laravel e Vue.js. Oferece versoes Lite (gratuita), Pro e Enterprise.

**Site**: https://mixpost.app
**Repositorio**: https://github.com/inovector/mixpost
**Documentacao**: https://docs.mixpost.app
**Licenca**: MIT (Lite) / Comercial (Pro/Enterprise)
**Stars**: 2.9k+

## Versoes Disponiveis

| Versao | Preco | Caracteristicas |
|--------|-------|-----------------|
| Lite | Gratis | Funcionalidades basicas, MIT |
| Pro | Pago | Mais recursos, suporte |
| Enterprise | Pago | Multi-tenancy, white-label |

## Funcionalidades Principais

### 1. Agendamento de Posts
- Calendario de publicacoes
- Agendamento para multiplas redes
- Rascunhos e filas

### 2. Gestao de Contas
- Multiplas contas de redes sociais
- Organizacao por workspace
- Gerenciamento de equipe

### 3. Analytics
- Metricas de engajamento
- Relatorios de performance
- Historico de publicacoes

### 4. Editor de Midia
- Upload de imagens e videos
- Biblioteca de midias
- Edicao basica

## Stack Tecnologica

| Componente | Tecnologia |
|------------|------------|
| Backend | Laravel (PHP) |
| Frontend | Vue.js |
| Banco de Dados | MySQL / PostgreSQL |
| Cache | Redis (opcional) |
| Gerenciador | Composer |

## Instalacao

### Opcoes de Deploy

1. **Docker** - Metodo recomendado
2. **Manual (PHP)** - Para quem conhece PHP/Laravel
3. **Em App Laravel Existente** - Como pacote Composer

### Requisitos de Sistema

- PHP 8.1+
- MySQL 8.0+ ou PostgreSQL 13+
- Composer
- Node.js (para build do frontend)
- Dominio publico (para OAuth)

## Arquitetura

Mixpost e distribuido como um pacote Laravel, permitindo integracao em apps existentes:

```php
// composer.json
{
    "require": {
        "inovector/mixpost": "^1.0"
    }
}
```

### Estrutura do Pacote
```
mixpost/
├── src/
│   ├── Http/         # Controllers
│   ├── Models/       # Eloquent Models
│   ├── Jobs/         # Queue Jobs
│   └── Services/     # Integracao com APIs
├── resources/
│   └── js/           # Vue.js frontend
└── config/           # Configuracoes
```

## Plataformas Suportadas

- Facebook (paginas)
- Instagram
- X (Twitter)
- LinkedIn
- Pinterest
- TikTok
- YouTube
- Mastodon

## Diferenciais

1. **Laravel Nativo**: Facil para desenvolvedores PHP
2. **Pacote Composer**: Pode ser integrado em apps existentes
3. **Self-Hosted**: Dados ficam no seu servidor
4. **Interface Limpa**: UI moderna e intuitiva
5. **Versao Gratuita**: Lite e MIT e totalmente funcional

## Limitacoes

1. **Stack PHP**: Requer conhecimento de Laravel
2. **Menos Plataformas**: Menos redes que Postiz
3. **Sem IA**: Nao tem geracao de conteudo com IA
4. **Sem Ads**: Apenas conteudo organico

## Comparacao com Postiz

| Aspecto | Mixpost | Postiz |
|---------|---------|--------|
| Linguagem | PHP/Laravel | TypeScript/Node.js |
| Frontend | Vue.js | Next.js |
| ORM | Eloquent | Prisma |
| Licenca | MIT | Apache 2.0 |
| Plataformas | ~8 | ~20 |
| IA | Nao | Sim |
| Marketplace | Nao | Sim |
| Maturidade | Estavel | Muito ativo |

## O Que Podemos Aprender

1. Arquitetura de pacote Laravel reutilizavel
2. Sistema de filas para publicacao
3. Estrutura de jobs assincronos
4. Integracao OAuth com redes sociais
5. UI/UX clean para gestao de redes

## Referencias para OpenOnmeky

- Se escolhermos Laravel, Mixpost e referencia direta
- Estrutura de Models para posts e contas
- Sistema de workspaces e equipes
- Fluxo de autenticacao OAuth

