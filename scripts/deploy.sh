#!/bin/bash

# SwimFlow Production Deployment Script
# Este script automatiza o deploy para produção

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
ENVIRONMENT=${1:-production}
BUILD_DIR="build"
BACKUP_DIR="backups"

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Função para verificar se estamos na branch correta
check_git_branch() {
    local current_branch=$(git branch --show-current)
    
    if [ "$ENVIRONMENT" = "production" ] && [ "$current_branch" != "main" ]; then
        error "Deploy para produção deve ser feito a partir da branch 'main'"
        echo "Branch atual: $current_branch"
        exit 1
    fi
    
    # Verificar se há mudanças não commitadas
    if ! git diff-index --quiet HEAD --; then
        error "Há mudanças não commitadas. Faça commit antes do deploy."
        git status --porcelain
        exit 1
    fi
    
    log "Branch e estado do Git verificados ✓"
}

# Função para executar testes
run_tests() {
    log "Executando testes..."
    
    # Testes do backend
    log "Executando testes do backend..."
    cd backend && npm run test && cd ..
    
    # Testes do frontend
    log "Executando testes do frontend..."
    cd frontend && npm run test && cd ..
    
    log "Todos os testes passaram ✓"
}

# Função para fazer lint
run_lint() {
    log "Executando lint..."
    
    # Lint do backend
    cd backend && npm run lint && cd ..
    
    # Lint do frontend
    cd frontend && npm run lint && cd ..
    
    log "Lint passou ✓"
}

# Função para fazer backup do banco
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Fazendo backup do banco de dados..."
        
        # Criar diretório de backup se não existir
        mkdir -p $BACKUP_DIR
        
        # Nome do arquivo de backup
        local backup_file="$BACKUP_DIR/swimflow_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        # Fazer backup (ajustar conforme sua configuração)
        if [ -n "$DATABASE_URL" ]; then
            pg_dump "$DATABASE_URL" > "$backup_file"
            log "Backup salvo em: $backup_file"
        else
            warn "DATABASE_URL não definida, pulando backup"
        fi
    fi
}

# Função para build do projeto
build_project() {
    log "Fazendo build do projeto..."
    
    # Limpar builds anteriores
    rm -rf backend/dist frontend/dist
    
    # Build do backend
    log "Build do backend..."
    cd backend && npm run build && cd ..
    
    # Build do frontend
    log "Build do frontend..."
    cd frontend && npm run build && cd ..
    
    log "Build concluído ✓"
}

# Função para executar migrations
run_migrations() {
    log "Executando migrations do banco de dados..."
    
    cd backend
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npx prisma migrate deploy
    else
        npx prisma migrate dev
    fi
    
    # Gerar cliente Prisma
    npx prisma generate
    
    cd ..
    
    log "Migrations executadas ✓"
}

# Função para deploy no Render.com (ou outro provedor)
deploy_to_render() {
    log "Fazendo deploy para Render.com..."
    
    # Verificar se render.yaml existe
    if [ ! -f "render.yaml" ]; then
        error "Arquivo render.yaml não encontrado!"
        exit 1
    fi
    
    # Push para o repositório (Render faz deploy automático)
    git push origin main
    
    log "Deploy iniciado no Render.com ✓"
    info "Acompanhe o progresso em: https://dashboard.render.com"
}

# Função para deploy local/staging
deploy_local() {
    log "Fazendo deploy local/staging..."
    
    # Parar serviços existentes
    pkill -f "node.*dist/index.js" 2>/dev/null || true
    
    # Iniciar banco de dados
    docker-compose -f docker-compose.dev.yml up -d postgres
    
    # Aguardar banco estar pronto
    sleep 5
    
    # Executar migrations
    run_migrations
    
    # Iniciar backend
    cd backend && npm start &
    BACKEND_PID=$!
    cd ..
    
    # Servir frontend (usando serve ou nginx)
    if command -v serve >/dev/null 2>&1; then
        cd frontend && serve -s dist -l 3000 &
        FRONTEND_PID=$!
        cd ..
    else
        warn "Comando 'serve' não encontrado. Instale com: npm install -g serve"
    fi
    
    log "Deploy local concluído ✓"
    info "Frontend: http://localhost:3000"
    info "Backend: http://localhost:3001"
    
    # Salvar PIDs para poder parar depois
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
}

# Função para verificar saúde da aplicação
health_check() {
    log "Verificando saúde da aplicação..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            log "Backend está saudável ✓"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Backend não respondeu após $max_attempts tentativas"
            exit 1
        fi
        
        info "Tentativa $attempt/$max_attempts - aguardando backend..."
        sleep 2
        ((attempt++))
    done
    
    # Verificar frontend
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        log "Frontend está acessível ✓"
    else
        warn "Frontend pode não estar acessível"
    fi
}

# Função para rollback
rollback() {
    log "Executando rollback..."
    
    # Parar serviços atuais
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    # Restaurar backup mais recente
    local latest_backup=$(ls -t $BACKUP_DIR/*.sql 2>/dev/null | head -n1)
    if [ -n "$latest_backup" ]; then
        log "Restaurando backup: $latest_backup"
        if [ -n "$DATABASE_URL" ]; then
            psql "$DATABASE_URL" < "$latest_backup"
        fi
    fi
    
    log "Rollback concluído ✓"
}

# Função para mostrar status do deploy
show_deploy_status() {
    info "=== Status do Deploy ==="
    
    # Verificar se os serviços estão rodando
    if pgrep -f "node.*dist/index.js" >/dev/null; then
        echo -e "${GREEN}✓ Backend: Rodando${NC}"
    else
        echo -e "${RED}✗ Backend: Parado${NC}"
    fi
    
    if pgrep -f "serve.*dist" >/dev/null; then
        echo -e "${GREEN}✓ Frontend: Rodando${NC}"
    else
        echo -e "${RED}✗ Frontend: Parado${NC}"
    fi
    
    # Verificar banco
    if docker-compose -f docker-compose.dev.yml ps postgres | grep -q "Up"; then
        echo -e "${GREEN}✓ PostgreSQL: Rodando${NC}"
    else
        echo -e "${RED}✗ PostgreSQL: Parado${NC}"
    fi
    
    echo ""
    info "URLs de produção:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:3001"
}

# Função principal
main() {
    case "${1:-deploy}" in
        "deploy")
            log "🚀 Iniciando deploy para $ENVIRONMENT..."
            check_git_branch
            run_tests
            run_lint
            backup_database
            build_project
            
            if [ "$ENVIRONMENT" = "production" ]; then
                deploy_to_render
            else
                deploy_local
                health_check
            fi
            
            log "✅ Deploy concluído com sucesso!"
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_deploy_status
            ;;
        "health")
            health_check
            ;;
        "help"|"-h"|"--help")
            echo "SwimFlow Deployment Script"
            echo ""
            echo "Uso: ./scripts/deploy.sh [comando] [ambiente]"
            echo ""
            echo "Comandos disponíveis:"
            echo "  deploy   - Executa o deploy (padrão)"
            echo "  rollback - Executa rollback para versão anterior"
            echo "  status   - Mostra status do deploy"
            echo "  health   - Verifica saúde da aplicação"
            echo "  help     - Mostra esta ajuda"
            echo ""
            echo "Ambientes disponíveis:"
            echo "  production - Deploy para produção (padrão)"
            echo "  staging    - Deploy para staging/local"
            ;;
        *)
            error "Comando desconhecido: $1"
            echo "Execute './scripts/deploy.sh help' para ver os comandos disponíveis."
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"