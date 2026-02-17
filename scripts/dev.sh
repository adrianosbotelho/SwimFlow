#!/bin/bash

# SwimFlow Development Automation Script
# Este script automatiza o setup e execução do ambiente de desenvolvimento

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

is_port_listening() {
    local port="$1"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

find_free_port() {
    local start_port="$1"
    local port="$start_port"

    while [ "$port" -lt 65535 ]; do
        if ! is_port_listening "$port"; then
            echo "$port"
            return 0
        fi
        port=$((port + 1))
    done

    return 1
}

detect_swimflow_postgres_host_port() {
    if ! docker inspect swimflow-postgres >/dev/null 2>&1; then
        return 1
    fi

    local host_port
    host_port="$(
        docker inspect -f '{{(index (index .HostConfig.PortBindings "5432/tcp") 0).HostPort}}' swimflow-postgres 2>/dev/null || true
    )"

    if [[ "$host_port" =~ ^[0-9]+$ ]]; then
        echo "$host_port"
        return 0
    fi

    return 1
}

configure_database_env() {
    local selected_port=""

    if [ -n "${POSTGRES_PORT:-}" ]; then
        selected_port="$POSTGRES_PORT"
    else
        local existing_port=""
        existing_port="$(detect_swimflow_postgres_host_port || true)"
        if [ -n "$existing_port" ]; then
            if docker ps --format '{{.Names}}' | grep -qx "swimflow-postgres"; then
                selected_port="$existing_port"
            else
                if ! is_port_listening "$existing_port"; then
                    selected_port="$existing_port"
                else
                    selected_port="$(find_free_port 5433)"
                fi
            fi
        else
            if ! is_port_listening 5432; then
                selected_port="5432"
            else
                selected_port="$(find_free_port 5433)"
            fi
        fi
    fi

    export POSTGRES_PORT="$selected_port"
    export DATABASE_URL="postgresql://swimflow_user:swimflow_pass@127.0.0.1:${POSTGRES_PORT}/swimflow_db?schema=public"
    info "PostgreSQL host port: ${POSTGRES_PORT}"
}

# Função para verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi

    if ! command_exists lsof; then
        missing_deps+=("lsof")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Dependências faltando: ${missing_deps[*]}"
        echo "Por favor, instale as dependências antes de continuar."
        exit 1
    fi
    
    log "Todas as dependências estão instaladas ✓"
}

# Função para verificar se as portas estão disponíveis
check_ports() {
    log "Verificando portas das aplicações..."
    
    local ports=(3000 3001)
    local busy_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            busy_ports+=($port)
        fi
    done
    
    if [ ${#busy_ports[@]} -ne 0 ]; then
        error "Portas ocupadas: ${busy_ports[*]}"
        echo "Feche o que estiver usando essas portas e tente novamente."
        exit 1
    fi
}

# Função para instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
    # Root dependencies
    if [ ! -d "node_modules" ]; then
        log "Instalando dependências do projeto raiz..."
        npm install
    fi
    
    # Backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        log "Instalando dependências do backend..."
        cd backend && npm install && cd ..
    fi
    
    # Frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        log "Instalando dependências do frontend..."
        cd frontend && npm install && cd ..
    fi
    
    log "Dependências instaladas ✓"
}

# Função para garantir que o banco está de pé e migrado (não destrutivo)
ensure_database() {
    log "Garantindo banco de dados (PostgreSQL) ..."
    
    # Verificar se o arquivo .env existe
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            log "Copiando .env.example para .env..."
            cp backend/.env.example backend/.env
            warn "Por favor, configure as variáveis de ambiente em backend/.env"
        else
            error "Arquivo .env.example não encontrado!"
            exit 1
        fi
    fi
    
    # Iniciar banco de dados com Docker
    log "Iniciando banco de dados PostgreSQL..."
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    # Aguardar o banco estar pronto
    log "Aguardando banco de dados ficar pronto..."
    local max_wait=60
    local waited=0
    until docker exec swimflow-postgres pg_isready -U swimflow_user -d swimflow_db >/dev/null 2>&1; do
        sleep 2
        waited=$((waited + 2))
        if [ "$waited" -ge "$max_wait" ]; then
            error "Timeout aguardando PostgreSQL (porta ${POSTGRES_PORT})"
            docker-compose -f docker-compose.dev.yml logs postgres || true
            exit 1
        fi
    done
    
    # Executar migrations
    log "Executando migrations..."
    (cd backend && npx prisma migrate deploy)

    log "Banco de dados pronto ✓"
}

seed_database() {
    if [ "${RUN_SEED:-}" != "1" ]; then
        info "Seed ignorado (defina RUN_SEED=1 para rodar)"
        return 0
    fi

    if [ "${SEED_WIPE:-}" != "1" ]; then
        error "Seed nao autorizado sem SEED_WIPE=1"
        echo "Para rodar seed destrutivo (apaga dados), use: RUN_SEED=1 SEED_WIPE=1 make dev-setup"
        return 1
    fi

    warn "Rodando seed destrutivo (isso vai APAGAR dados existentes)"
    log "Populando banco com dados de desenvolvimento..."
    (cd backend && npx prisma db seed)
    log "Seed concluído ✓"
}

# Função para iniciar os serviços
start_services() {
    log "Iniciando serviços de desenvolvimento..."
    
    # Verificar se o banco está rodando
    if ! docker-compose -f docker-compose.dev.yml ps postgres | grep -q "Up"; then
        log "Iniciando banco de dados..."
        docker-compose -f docker-compose.dev.yml up -d postgres
        sleep 5
    fi
    
    # Gerar cliente Prisma
    log "Gerando cliente Prisma..."
    cd backend && npx prisma generate && cd ..
    
    # Iniciar frontend e backend em paralelo
    log "Iniciando frontend e backend..."
    npm run dev
}

# Função para parar os serviços
stop_services() {
    log "Parando serviços..."
    
    # Parar processos Node.js
    pkill -f "vite" 2>/dev/null || true
    pkill -f "tsx" 2>/dev/null || true
    
    # Parar Docker containers
    docker-compose -f docker-compose.dev.yml down
    
    log "Serviços parados ✓"
}

# Função para limpar o ambiente
clean_environment() {
    log "Limpando ambiente de desenvolvimento..."
    
    # Parar serviços
    stop_services
    
    # Remover node_modules
    rm -rf node_modules backend/node_modules frontend/node_modules
    
    # Remover builds
    rm -rf backend/dist frontend/dist
    
    # Remover volumes Docker
    docker-compose -f docker-compose.dev.yml down -v
    
    log "Ambiente limpo ✓"
}

# Função para mostrar status
show_status() {
    info "=== Status dos Serviços ==="
    
    # Status do banco
    if docker-compose -f docker-compose.dev.yml ps postgres | grep -q "Up"; then
        echo -e "${GREEN}✓ PostgreSQL: Rodando${NC}"
    else
        echo -e "${RED}✗ PostgreSQL: Parado${NC}"
    fi
    
    # Status das portas
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend (3000): Rodando${NC}"
    else
        echo -e "${RED}✗ Frontend (3000): Parado${NC}"
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend (3001): Rodando${NC}"
    else
        echo -e "${RED}✗ Backend (3001): Parado${NC}"
    fi
    
    echo ""
    info "URLs de acesso:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:3001"
    echo "  Prisma Studio: http://localhost:5555 (execute: npm run db:studio)"
}

# Função para mostrar logs
show_logs() {
    log "Mostrando logs dos serviços..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            log "🚀 Iniciando ambiente de desenvolvimento SwimFlow..."
            check_dependencies
            configure_database_env
            check_ports
            install_dependencies
            ensure_database
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services
            ;;
        "clean")
            clean_environment
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "setup")
            log "🔧 Configurando ambiente pela primeira vez..."
            check_dependencies
            configure_database_env
            install_dependencies
            ensure_database
            seed_database
            log "✅ Setup completo! Execute './scripts/dev.sh start' para iniciar."
            ;;
        "help"|"-h"|"--help")
            echo "SwimFlow Development Script"
            echo ""
            echo "Uso: ./scripts/dev.sh [comando]"
            echo ""
            echo "Comandos disponíveis:"
            echo "  start    - Inicia o ambiente de desenvolvimento (padrão)"
            echo "  stop     - Para todos os serviços"
            echo "  restart  - Reinicia todos os serviços"
            echo "  clean    - Limpa o ambiente (remove node_modules, builds, etc.)"
            echo "  status   - Mostra o status dos serviços"
            echo "  logs     - Mostra os logs dos serviços"
            echo "  setup    - Configuração inicial do ambiente"
            echo "  help     - Mostra esta ajuda"
            ;;
        *)
            error "Comando desconhecido: $1"
            echo "Execute './scripts/dev.sh help' para ver os comandos disponíveis."
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
