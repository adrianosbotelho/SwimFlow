# SwimFlow Management System - Makefile
# Este Makefile fornece comandos simplificados para desenvolvimento

.PHONY: help install dev build test clean deploy db-* docker-*

# Configurações
SHELL := /bin/bash
NODE_ENV ?= development

# Cores para output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Função para logging
define log
	@echo -e "$(GREEN)[$(shell date +'%H:%M:%S')] $(1)$(NC)"
endef

define warn
	@echo -e "$(YELLOW)[$(shell date +'%H:%M:%S')] WARNING: $(1)$(NC)"
endef

define error
	@echo -e "$(RED)[$(shell date +'%H:%M:%S')] ERROR: $(1)$(NC)"
endef

##@ Ajuda
help: ## Mostra esta ajuda
	@awk 'BEGIN {FS = ":.*##"; printf "\nSwimFlow Management System\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Desenvolvimento
install: ## Instala todas as dependências
	$(call log,"Instalando dependências...")
	@npm install
	@cd backend && npm install
	@cd frontend && npm install
	$(call log,"Dependências instaladas ✓")

dev: ## Inicia ambiente de desenvolvimento completo (com banco)
	@./scripts/dev.sh start

dev-apps: ## Inicia APENAS frontend e backend (sem banco/docker)
	$(call log,"Iniciando apenas aplicações (frontend + backend)...")
	@npm run dev:apps

dev-apps-only: dev-apps ## Alias para dev-apps

dev-backend: ## Inicia apenas o backend
	$(call log,"Iniciando apenas o backend...")
	@cd backend && npm run dev

dev-frontend: ## Inicia apenas o frontend
	$(call log,"Iniciando apenas o frontend...")
	@cd frontend && npm run dev

dev-setup: ## Configuração inicial do ambiente de desenvolvimento
	@./scripts/dev.sh setup

dev-stop: ## Para o ambiente de desenvolvimento
	@./scripts/dev.sh stop

dev-restart: ## Reinicia o ambiente de desenvolvimento
	@./scripts/dev.sh restart

dev-status: ## Mostra status do ambiente de desenvolvimento
	@./scripts/dev.sh status

dev-logs: ## Mostra logs dos serviços
	@./scripts/dev.sh logs

dev-clean: ## Limpa o ambiente de desenvolvimento
	@./scripts/dev.sh clean

##@ Build e Deploy
build: ## Faz build do projeto
	$(call log,"Fazendo build do projeto...")
	@npm run build
	$(call log,"Build concluído ✓")

build-backend: ## Faz build apenas do backend
	$(call log,"Fazendo build do backend...")
	@cd backend && npm run build
	$(call log,"Build do backend concluído ✓")

build-frontend: ## Faz build apenas do frontend
	$(call log,"Fazendo build do frontend...")
	@cd frontend && npm run build
	$(call log,"Build do frontend concluído ✓")

deploy: ## Deploy para produção
	@./scripts/deploy.sh deploy production

deploy-staging: ## Deploy para staging
	@./scripts/deploy.sh deploy staging

deploy-status: ## Mostra status do deploy
	@./scripts/deploy.sh status

deploy-rollback: ## Executa rollback
	@./scripts/deploy.sh rollback

##@ Testes
test: ## Executa todos os testes
	@./scripts/test-runner.sh all

test-backend: ## Executa testes do backend
	@./scripts/test-runner.sh backend

test-frontend: ## Executa testes do frontend
	@./scripts/test-runner.sh frontend

test-integration: ## Executa testes de integração
	@./scripts/test-runner.sh integration

test-e2e: ## Executa testes E2E
	@./scripts/test-runner.sh e2e

test-performance: ## Executa testes de performance
	@./scripts/test-runner.sh performance

test-coverage: ## Executa testes com cobertura
	@./scripts/test-runner.sh coverage

test-watch-backend: ## Executa testes do backend em modo watch
	@./scripts/test-runner.sh watch backend

test-watch-frontend: ## Executa testes do frontend em modo watch
	@./scripts/test-runner.sh watch frontend

test-clean: ## Limpa arquivos de teste
	@./scripts/test-runner.sh clean

test-stats: ## Mostra estatísticas de teste
	@./scripts/test-runner.sh stats

##@ Qualidade de Código
lint: ## Executa lint em todo o projeto
	$(call log,"Executando lint...")
	@npm run lint
	$(call log,"Lint concluído ✓")

lint-fix: ## Corrige problemas de lint automaticamente
	$(call log,"Corrigindo problemas de lint...")
	@npm run lint:fix
	$(call log,"Lint fix concluído ✓")

format: ## Formata código com Prettier
	$(call log,"Formatando código...")
	@npm run format
	$(call log,"Formatação concluída ✓")

format-check: ## Verifica formatação do código
	$(call log,"Verificando formatação...")
	@npm run format:check
	$(call log,"Verificação de formatação concluída ✓")

type-check: ## Verifica tipos TypeScript
	@./scripts/test-runner.sh types

##@ Banco de Dados
db-status: ## Mostra status do banco de dados
	@./scripts/db-manager.sh status

db-migrate: ## Executa migrations
	@./scripts/db-manager.sh migrate

db-migrate-create: ## Cria nova migration
	@read -p "Nome da migration: " name; ./scripts/db-manager.sh migrate:create "$$name"

db-seed: ## Popula banco com dados de desenvolvimento
	@./scripts/db-manager.sh seed

db-reset: ## Reseta o banco de dados
	@./scripts/db-manager.sh reset

db-backup: ## Faz backup do banco de dados
	@./scripts/db-manager.sh backup

db-restore: ## Restaura backup do banco
	@read -p "Arquivo de backup: " file; ./scripts/db-manager.sh restore "$$file"

db-studio: ## Abre Prisma Studio
	@./scripts/db-manager.sh studio

db-cleanup: ## Remove backups antigos
	@./scripts/db-manager.sh cleanup

db-integrity: ## Verifica integridade do banco
	@./scripts/db-manager.sh integrity

##@ Docker
docker-up: ## Inicia containers Docker
	$(call log,"Iniciando containers Docker...")
	@docker-compose -f docker-compose.dev.yml up -d
	$(call log,"Containers iniciados ✓")

docker-down: ## Para containers Docker
	$(call log,"Parando containers Docker...")
	@docker-compose -f docker-compose.dev.yml down
	$(call log,"Containers parados ✓")

docker-logs: ## Mostra logs dos containers
	@docker-compose -f docker-compose.dev.yml logs -f

docker-clean: ## Remove containers, volumes e imagens
	$(call log,"Limpando Docker...")
	@docker-compose -f docker-compose.dev.yml down -v --rmi all
	$(call log,"Docker limpo ✓")

docker-rebuild: ## Reconstrói containers
	$(call log,"Reconstruindo containers...")
	@docker-compose -f docker-compose.dev.yml build --no-cache
	$(call log,"Containers reconstruídos ✓")

##@ Utilitários
clean: ## Limpa todos os arquivos temporários
	$(call log,"Limpando arquivos temporários...")
	@rm -rf node_modules backend/node_modules frontend/node_modules
	@rm -rf backend/dist frontend/dist
	@rm -rf coverage test-reports
	@rm -rf .next .cache
	$(call log,"Limpeza concluída ✓")

setup: ## Configuração completa do projeto
	$(call log,"Configurando projeto SwimFlow...")
	@make install
	@make dev-setup
	$(call log,"Projeto configurado ✓")
	@echo ""
	@echo "🎉 SwimFlow está pronto para desenvolvimento!"
	@echo ""
	@echo "Próximos passos:"
	@echo "  1. Configure as variáveis de ambiente em backend/.env"
	@echo "  2. Execute 'make dev' para iniciar o ambiente de desenvolvimento"
	@echo "  3. Acesse http://localhost:3000 para ver a aplicação"

validate: ## Valida configuração do projeto
	$(call log,"Validando configuração...")
	@node scripts/validate-setup.js
	$(call log,"Validação concluída ✓")

health: ## Verifica saúde da aplicação
	@./scripts/deploy.sh health

logs: ## Mostra logs da aplicação
	@tail -f backend/logs/*.log 2>/dev/null || echo "Nenhum log encontrado"

##@ Informações
version: ## Mostra versão do projeto
	@echo "SwimFlow Management System"
	@echo "Versão: $(shell node -p "require('./package.json').version")"
	@echo "Node.js: $(shell node --version)"
	@echo "npm: $(shell npm --version)"

env: ## Mostra informações do ambiente
	@echo "Ambiente: $(NODE_ENV)"
	@echo "Sistema: $(shell uname -s)"
	@echo "Arquitetura: $(shell uname -m)"
	@echo "Usuário: $(shell whoami)"
	@echo "Diretório: $(shell pwd)"

ports: ## Mostra portas em uso
	@echo "Portas em uso:"
	@lsof -i :3000 -i :3001 -i :5432 -i :5555 2>/dev/null || echo "Nenhuma porta relevante em uso"

##@ Atalhos Rápidos
start: dev ## Alias para 'make dev'
start-apps: dev-apps ## Alias para 'make dev-apps' (apenas frontend + backend)
apps: dev-apps ## Alias curto para 'make dev-apps'
backend: dev-backend ## Alias para 'make dev-backend'
frontend: dev-frontend ## Alias para 'make dev-frontend'
stop: dev-stop ## Alias para 'make dev-stop'
restart: dev-restart ## Alias para 'make dev-restart'
status: dev-status ## Alias para 'make dev-status'