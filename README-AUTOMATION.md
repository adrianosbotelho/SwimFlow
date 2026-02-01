# 🤖 SwimFlow - Automação de Desenvolvimento

Este documento descreve todos os scripts de automação disponíveis no projeto SwimFlow para facilitar o desenvolvimento, testes e deploy.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Scripts Principais](#scripts-principais)
- [Makefile](#makefile)
- [Scripts Bash](#scripts-bash)
- [Docker](#docker)
- [Exemplos de Uso](#exemplos-de-uso)

## 🎯 Visão Geral

O SwimFlow possui um sistema completo de automação que inclui:

- **Scripts de desenvolvimento** - Setup e execução do ambiente local
- **Scripts de teste** - Execução de testes unitários, integração e E2E
- **Scripts de deploy** - Deploy automatizado para produção e staging
- **Scripts de banco** - Gerenciamento completo do banco de dados
- **Makefile** - Comandos simplificados para todas as operações
- **Docker** - Containerização para desenvolvimento e produção

## 🚀 Scripts Principais

### Comandos Rápidos (Makefile)

```bash
# Configuração inicial completa
make setup

# Desenvolvimento - DIFERENTES OPÇÕES:

# 1. Ambiente completo (com banco Docker)
make dev          # Inicia tudo: banco + frontend + backend

# 2. APENAS aplicações (sem Docker/banco)
make dev-apps     # Inicia APENAS frontend + backend
make apps         # Alias curto para dev-apps
make start-apps   # Outro alias

# 3. Serviços individuais
make dev-backend  # Apenas backend
make dev-frontend # Apenas frontend
make backend      # Alias curto
make frontend     # Alias curto

# Controle
make dev-stop     # Para o ambiente
make dev-restart  # Reinicia o ambiente
make dev-status   # Mostra status dos serviços

# Testes
make test                # Todos os testes
make test-backend        # Apenas backend
make test-frontend       # Apenas frontend
make test-coverage       # Com cobertura de código
make test-watch-backend  # Modo watch backend

# Build e Deploy
make build         # Build completo
make deploy        # Deploy para produção
make deploy-staging # Deploy para staging

# Banco de Dados
make db-migrate    # Executa migrations
make db-seed       # Popula com dados
make db-backup     # Faz backup
make db-studio     # Abre Prisma Studio

# Qualidade de Código
make lint          # Executa lint
make lint-fix      # Corrige problemas automaticamente
make format        # Formata código
make type-check    # Verifica tipos TypeScript

# Docker
make docker-up     # Inicia containers
make docker-down   # Para containers
make docker-logs   # Mostra logs

# Utilitários
make clean         # Limpa arquivos temporários
make health        # Verifica saúde da aplicação
make help          # Mostra todos os comandos
```

## 📝 Scripts Bash

### 1. Script de Desenvolvimento (`scripts/dev.sh`)

```bash
# Configuração inicial
./scripts/dev.sh setup

# Iniciar desenvolvimento
./scripts/dev.sh start

# Parar serviços
./scripts/dev.sh stop

# Reiniciar
./scripts/dev.sh restart

# Status dos serviços
./scripts/dev.sh status

# Logs em tempo real
./scripts/dev.sh logs

# Limpeza completa
./scripts/dev.sh clean
```

**Funcionalidades:**
- ✅ Verificação automática de dependências
- ✅ Verificação de portas disponíveis
- ✅ Instalação automática de dependências
- ✅ Setup do banco de dados
- ✅ Inicialização paralela de frontend e backend
- ✅ Logs coloridos e informativos

### 2. Script de Aplicações (`scripts/apps-only.sh`)

```bash
# Iniciar apenas frontend + backend (sem Docker)
./scripts/apps-only.sh start

# Parar aplicações
./scripts/apps-only.sh stop

# Status das aplicações
./scripts/apps-only.sh status

# Verificar saúde
./scripts/apps-only.sh health

# Instalar dependências
./scripts/apps-only.sh install
```

**Funcionalidades:**
- ✅ Inicia apenas frontend e backend
- ✅ Não depende do Docker ou banco
- ✅ Verificação automática de dependências
- ✅ Verificação de portas disponíveis
- ✅ Geração automática do cliente Prisma
- ✅ Logs coloridos e organizados
- ✅ Health checks das aplicações

### 3. Script de Deploy (`scripts/deploy.sh`)

```bash
# Deploy para produção
./scripts/deploy.sh deploy production

# Deploy para staging
./scripts/deploy.sh deploy staging

# Rollback
./scripts/deploy.sh rollback

# Status do deploy
./scripts/deploy.sh status

# Verificação de saúde
./scripts/deploy.sh health
```

**Funcionalidades:**
- ✅ Verificação de branch Git
- ✅ Execução automática de testes
- ✅ Backup automático do banco
- ✅ Build otimizado
- ✅ Deploy para Render.com
- ✅ Verificação de saúde pós-deploy
- ✅ Rollback automático em caso de falha

### 4. Script de Banco de Dados (`scripts/db-manager.sh`)

```bash
# Status do banco
./scripts/db-manager.sh status

# Backup
./scripts/db-manager.sh backup

# Restaurar backup
./scripts/db-manager.sh restore backups/backup_file.sql

# Migrations
./scripts/db-manager.sh migrate

# Criar nova migration
./scripts/db-manager.sh migrate:create "add_new_table"

# Seed
./scripts/db-manager.sh seed

# Reset completo
./scripts/db-manager.sh reset

# Prisma Studio
./scripts/db-manager.sh studio

# Limpeza de backups antigos
./scripts/db-manager.sh cleanup 30

# Verificação de integridade
./scripts/db-manager.sh integrity
```

**Funcionalidades:**
- ✅ Backup automático com timestamp
- ✅ Restauração segura com confirmação
- ✅ Migrations automáticas
- ✅ Verificação de integridade
- ✅ Limpeza automática de backups antigos
- ✅ Integração completa com Prisma

### 5. Script de Testes (`scripts/test-runner.sh`)

```bash
# Todos os testes
./scripts/test-runner.sh all

# Testes específicos
./scripts/test-runner.sh backend
./scripts/test-runner.sh frontend
./scripts/test-runner.sh integration
./scripts/test-runner.sh e2e

# Com cobertura
./scripts/test-runner.sh coverage

# Testes de performance
./scripts/test-runner.sh performance

# Modo watch
./scripts/test-runner.sh watch backend
./scripts/test-runner.sh watch frontend

# Lint e tipos
./scripts/test-runner.sh lint
./scripts/test-runner.sh types

# Estatísticas
./scripts/test-runner.sh stats

# Limpeza
./scripts/test-runner.sh clean
```

**Funcionalidades:**
- ✅ Execução paralela de testes
- ✅ Relatórios de cobertura HTML
- ✅ Testes de performance com Artillery
- ✅ Integração com Jest e Vitest
- ✅ Verificação de tipos TypeScript
- ✅ Estatísticas detalhadas

### 5. Script de Aplicações (`scripts/apps-only.sh`)

```bash
# Iniciar apenas frontend + backend (sem Docker)
./scripts/apps-only.sh start

# Parar aplicações
./scripts/apps-only.sh stop

# Status das aplicações
./scripts/apps-only.sh status

# Verificar saúde
./scripts/apps-only.sh health

# Instalar dependências
./scripts/apps-only.sh install
```

**Funcionalidades:**
- ✅ Inicia apenas frontend e backend
- ✅ Não depende do Docker ou banco
- ✅ Verificação automática de dependências
- ✅ Verificação de portas disponíveis
- ✅ Geração automática do cliente Prisma
- ✅ Logs coloridos e organizados
- ✅ Health checks das aplicações

```bash
# Todos os testes
./scripts/test-runner.sh all

# Testes específicos
./scripts/test-runner.sh backend
./scripts/test-runner.sh frontend
./scripts/test-runner.sh integration
./scripts/test-runner.sh e2e

# Com cobertura
./scripts/test-runner.sh coverage

# Testes de performance
./scripts/test-runner.sh performance

# Modo watch
./scripts/test-runner.sh watch backend
./scripts/test-runner.sh watch frontend

# Lint e tipos
./scripts/test-runner.sh lint
./scripts/test-runner.sh types

# Estatísticas
./scripts/test-runner.sh stats

# Limpeza
./scripts/test-runner.sh clean
```

**Funcionalidades:**
- ✅ Execução paralela de testes
- ✅ Relatórios de cobertura HTML
- ✅ Testes de performance com Artillery
- ✅ Integração com Jest e Vitest
- ✅ Verificação de tipos TypeScript
- ✅ Estatísticas detalhadas

## 🐳 Docker

### Desenvolvimento
```bash
# Iniciar apenas o banco
docker-compose -f docker-compose.dev.yml up -d postgres

# Todos os serviços de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Testes
```bash
# Banco de teste
docker-compose -f docker-compose.test.yml up -d postgres-test

# Parar testes
docker-compose -f docker-compose.test.yml down
```

## 📊 Exemplos de Uso

### Cenários de Desenvolvimento

#### 1. Desenvolvimento com Banco Externo
```bash
# Quando você já tem PostgreSQL rodando localmente ou em outro lugar
make dev-apps     # Inicia apenas frontend + backend
# ou
make apps         # Alias curto
```

#### 2. Desenvolvimento Completo
```bash
# Quando você quer tudo automatizado (banco + aplicações)
make dev          # Inicia Docker + frontend + backend
```

#### 3. Desenvolvimento Individual
```bash
# Trabalhar apenas no backend
make backend

# Trabalhar apenas no frontend  
make frontend
```

### Fluxo de Desenvolvimento Completo

```bash
# 1. Configuração inicial (apenas primeira vez)
make setup

# 2. Escolher modo de desenvolvimento:

# OPÇÃO A: Apenas aplicações (banco externo)
make dev-apps

# OPÇÃO B: Ambiente completo (com Docker)
make dev

# 3. Em outro terminal - executar testes em watch
make test-watch-backend

# 4. Fazer mudanças no código...

# 5. Executar testes completos antes de commit
make test

# 6. Lint e formatação
make lint-fix
make format

# 7. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push
```

### Fluxo de Deploy

```bash
# 1. Verificar se tudo está funcionando
make test
make build

# 2. Deploy para staging primeiro
make deploy-staging

# 3. Testar staging...

# 4. Deploy para produção
make deploy

# 5. Verificar saúde da aplicação
make health
```

### Gerenciamento de Banco

```bash
# 1. Backup antes de mudanças importantes
make db-backup

# 2. Criar nova migration
make db-migrate-create
# Digite o nome: "add_user_preferences"

# 3. Executar migration
make db-migrate

# 4. Popular com dados de teste
make db-seed

# 5. Abrir Prisma Studio para verificar
make db-studio
```

### Debugging e Monitoramento

```bash
# Status geral
make status

# Logs em tempo real
make dev-logs

# Verificar portas
make ports

# Informações do ambiente
make env

# Verificar saúde
make health
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

Certifique-se de configurar os arquivos:
- `backend/.env` - Desenvolvimento
- `backend/.env.test` - Testes
- `backend/.env.production` - Produção

### Dependências Necessárias

- Node.js 18+
- npm 9+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Git

### Verificação de Setup

```bash
# Verificar se tudo está configurado corretamente
make validate
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Portas ocupadas**
   ```bash
   make ports  # Ver portas em uso
   make dev-clean  # Limpar processos
   ```

2. **Banco de dados não conecta**
   ```bash
   make docker-up  # Iniciar PostgreSQL
   make db-status  # Verificar status
   ```

3. **Dependências desatualizadas**
   ```bash
   make clean  # Limpar node_modules
   make install  # Reinstalar
   ```

4. **Testes falhando**
   ```bash
   make test-clean  # Limpar cache de testes
   make test  # Executar novamente
   ```

## 📈 Monitoramento e Logs

### Logs de Desenvolvimento
```bash
make dev-logs  # Logs de todos os serviços
make docker-logs  # Logs dos containers
```

### Logs de Produção
```bash
make logs  # Logs da aplicação
tail -f backend/logs/app.log  # Log específico
```

### Métricas de Performance
```bash
make test-performance  # Testes de carga
make health  # Status da aplicação
```

## 🎉 Conclusão

Este sistema de automação foi projetado para:

- **Simplificar** o desenvolvimento diário
- **Padronizar** processos entre desenvolvedores
- **Automatizar** tarefas repetitivas
- **Garantir** qualidade de código
- **Facilitar** deploys seguros
- **Monitorar** a saúde da aplicação

Para mais detalhes sobre comandos específicos, use:
```bash
make help
./scripts/dev.sh help
./scripts/deploy.sh help
./scripts/db-manager.sh help
./scripts/test-runner.sh help
```