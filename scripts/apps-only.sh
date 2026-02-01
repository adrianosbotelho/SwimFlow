#!/bin/bash

# SwimFlow Apps-Only Script
# Este script inicia apenas frontend e backend, sem Docker ou banco de dados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Função para verificar dependências básicas
check_basic_dependencies() {
    log "Verificando dependências básicas..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Dependências faltando: ${missing_deps[*]}"
        echo "Por favor, instale as dependências antes de continuar."
        exit 1
    fi
    
    log "Dependências básicas OK ✓"
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
        warn "Portas ocupadas: ${busy_ports[*]}"
        echo "Deseja parar os processos nessas portas? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            for port in "${busy_ports[@]}"; do
                log "Parando processo na porta $port..."
                lsof -ti:$port | xargs kill -9 2>/dev/null || true
            done
        fi
    fi
}

# Função para verificar se as dependências estão instaladas
check_node_modules() {
    log "Verificando dependências do projeto..."
    
    local missing_modules=()
    
    if [ ! -d "backend/node_modules" ]; then
        missing_modules+=("backend")
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        missing_modules+=("frontend")
    fi
    
    if [ ${#missing_modules[@]} -ne 0 ]; then
        warn "Dependências não instaladas em: ${missing_modules[*]}"
        echo "Deseja instalar as dependências agora? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            install_dependencies
        else
            error "Dependências são necessárias para executar as aplicações"
            exit 1
        fi
    fi
    
    log "Dependências verificadas ✓"
}

# Função para instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
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

# Função para verificar arquivos de configuração
check_config_files() {
    log "Verificando arquivos de configuração..."
    
    # Verificar .env do backend
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            warn "Arquivo .env não encontrado, copiando do .env.example..."
            cp backend/.env.example backend/.env
            warn "Por favor, configure as variáveis de ambiente em backend/.env"
        else
            warn "Arquivo .env não encontrado no backend"
        fi
    fi
    
    log "Configurações verificadas ✓"
}

# Função para gerar cliente Prisma
generate_prisma() {
    log "Gerando cliente Prisma..."
    
    cd backend
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        log "Cliente Prisma gerado ✓"
    else
        warn "Schema Prisma não encontrado, pulando geração"
    fi
    cd ..
}

# Função para iniciar as aplicações
start_apps() {
    log "🚀 Iniciando aplicações SwimFlow..."
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "Execute este script a partir do diretório raiz do projeto SwimFlow"
        exit 1
    fi
    
    # Gerar cliente Prisma
    generate_prisma
    
    info "Iniciando frontend e backend em paralelo..."
    echo ""
    echo -e "${CYAN}=== INFORMAÇÕES DE ACESSO ===${NC}"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend:${NC}  http://localhost:3001"
    echo ""
    echo -e "${YELLOW}Pressione Ctrl+C para parar ambas as aplicações${NC}"
    echo ""
    
    # Usar concurrently para executar ambos em paralelo com cores
    npx concurrently \
        --names "BACKEND,FRONTEND" \
        --prefix-colors "blue,green" \
        --prefix "[{name}]" \
        --kill-others-on-fail \
        "cd backend && npm run dev" \
        "cd frontend && npm run dev"
}

# Função para parar as aplicações
stop_apps() {
    log "Parando aplicações..."
    
    # Parar processos Node.js relacionados ao projeto
    pkill -f "vite.*frontend" 2>/dev/null || true
    pkill -f "tsx.*backend" 2>/dev/null || true
    pkill -f "node.*backend" 2>/dev/null || true
    
    log "Aplicações paradas ✓"
}

# Função para mostrar status das aplicações
show_status() {
    info "=== Status das Aplicações ==="
    
    # Status do frontend
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend (3000): Rodando${NC}"
    else
        echo -e "${RED}✗ Frontend (3000): Parado${NC}"
    fi
    
    # Status do backend
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend (3001): Rodando${NC}"
    else
        echo -e "${RED}✗ Backend (3001): Parado${NC}"
    fi
    
    echo ""
    info "URLs de acesso:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:3001"
    echo "  Backend Health: http://localhost:3001/health"
}

# Função para mostrar logs das aplicações
show_logs() {
    info "Mostrando logs das aplicações..."
    
    # Mostrar logs dos processos em execução
    echo "=== Processos Node.js em execução ==="
    ps aux | grep -E "(node|tsx|vite)" | grep -v grep || echo "Nenhum processo encontrado"
    
    echo ""
    echo "=== Logs do Backend ==="
    if [ -f "backend/logs/app.log" ]; then
        tail -n 20 backend/logs/app.log
    else
        echo "Arquivo de log não encontrado"
    fi
}

# Função para verificar saúde das aplicações
health_check() {
    log "Verificando saúde das aplicações..."
    
    local backend_healthy=false
    local frontend_healthy=false
    
    # Verificar backend
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend: Saudável${NC}"
        backend_healthy=true
    else
        echo -e "${RED}✗ Backend: Não responde${NC}"
    fi
    
    # Verificar frontend
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend: Acessível${NC}"
        frontend_healthy=true
    else
        echo -e "${RED}✗ Frontend: Não acessível${NC}"
    fi
    
    if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
        log "Todas as aplicações estão saudáveis ✓"
    else
        warn "Algumas aplicações podem ter problemas"
    fi
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            log "🚀 Iniciando apenas as aplicações (frontend + backend)..."
            check_basic_dependencies
            check_ports
            check_node_modules
            check_config_files
            start_apps
            ;;
        "stop")
            stop_apps
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "health")
            health_check
            ;;
        "install")
            check_basic_dependencies
            install_dependencies
            ;;
        "help"|"-h"|"--help")
            echo "SwimFlow Apps-Only Script"
            echo ""
            echo "Este script inicia apenas frontend e backend, sem Docker ou banco de dados."
            echo ""
            echo "Uso: ./scripts/apps-only.sh [comando]"
            echo ""
            echo "Comandos disponíveis:"
            echo "  start    - Inicia frontend e backend (padrão)"
            echo "  stop     - Para as aplicações"
            echo "  status   - Mostra status das aplicações"
            echo "  logs     - Mostra logs das aplicações"
            echo "  health   - Verifica saúde das aplicações"
            echo "  install  - Instala dependências"
            echo "  help     - Mostra esta ajuda"
            echo ""
            echo "Pré-requisitos:"
            echo "  - Node.js e npm instalados"
            echo "  - Banco de dados rodando separadamente (se necessário)"
            echo "  - Arquivo backend/.env configurado"
            ;;
        *)
            error "Comando desconhecido: $1"
            echo "Execute './scripts/apps-only.sh help' para ver os comandos disponíveis."
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"