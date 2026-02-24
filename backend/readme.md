# OpenOnmeky Backend

## About

Backend do OpenOnmeky, uma plataforma de gerenciamento de redes sociais com IA. Usa [FeathersJS](http://feathersjs.com) como framework.

## Getting Started

1. Instale as dependencias:
    ```bash
    npm install
    ```

2. Configure as variaveis de ambiente (veja secao Seguranca)

3. Execute as migrations:
    ```bash
    npm run migrate
    ```

4. Inicie o servidor:
    ```bash
    npm run dev  # Desenvolvimento
    npm start    # Producao
    ```

## Seguranca

### Variaveis de Ambiente

Configure as seguintes variaveis em producao:

| Variavel | Descricao | Obrigatorio |
|----------|-----------|-------------|
| `FEATHERS_SECRET` | Secret para assinatura JWT (min 32 caracteres) | Sim (producao) |
| `NODE_ENV` | Ambiente (development/production) | Recomendado |
| `PORT` | Porta do servidor (default: 3030) | Nao |
| `HOSTNAME` | Host do servidor (default: localhost) | Nao |

Exemplo de configuracao:
```bash
export FEATHERS_SECRET="sua-chave-secreta-muito-longa-e-segura-aqui"
export NODE_ENV=production
```

**ATENCAO**: Em producao, o servidor NAO iniciara se `FEATHERS_SECRET` nao estiver definido.

### Sistema de Autenticacao

- JWT (JSON Web Token) para autenticacao de usuarios
- Estrategia local (email/password) para login
- Tokens expiram em 24 horas

### Sistema de Autorizacao (RBAC)

O sistema implementa controle de acesso baseado em roles:

| Role | Permissoes |
|------|------------|
| `super-admin` | Todas as permissoes (`*`) |
| `admin` | Gerenciar usuarios, brands, posts, settings, system, ai |
| `editor` | Ler/escrever brands e posts, usar IA |
| `viewer` | Somente leitura de brands e posts |

### Isolamento de Dados (Multi-tenant)

- Usuarios so podem acessar dados de suas proprias brands
- Posts, medias, ai-generation-logs sao filtrados automaticamente
- Hooks verificam ownership antes de operacoes de escrita

### Endpoints Protegidos

| Endpoint | Autenticacao | Autorizacao |
|----------|--------------|-------------|
| `/seed` | JWT | super-admin |
| `/system` | JWT | admin |
| `/platforms` | JWT (read), admin (write) | - |
| `/roles` | JWT (read), super-admin (write) | - |
| `/prompt-templates` | JWT (read), admin (write) | - |
| `/settings/ai/*` | JWT | admin |
| `/users` | JWT (exceto create) | - |
| Demais servicos | JWT | Owner check |

## Testing

Execute os testes:
```bash
npm test
```

## Scaffolding

Comandos uteis do Feathers CLI:
```bash
npx feathers help                  # Mostrar comandos
npx feathers generate service      # Gerar novo servico
```

## Documentacao

- [FeathersJS Docs](http://docs.feathersjs.com)
- [Authentication Guide](http://docs.feathersjs.com/guides/cli/authentication.html)
