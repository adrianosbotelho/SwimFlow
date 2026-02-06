#!/bin/bash

# SwimFlow Development Automation Script
# Este script automatiza o setup e execução do ambiente de desenvolvimento

set -e

# Prefer Homebrew Node 22 LTS if installed (avoids Prisma issues on non-LTS Node).
if [ -x "/opt/homebrew/opt/node@22/bin/node" ]; then
    export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
fi

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

# Ensures deps are compatible with the current Node version.
# When switching Node versions (e.g. from non-LTS to LTS), native addons may need rebuild.
ensure_deps() {
    local dir="$1"
    local label="$2"
    local current_node stamp_file previous_node

    current_node="$(node -v 2>/dev/null || true)"
    stamp_file="$dir/node_modules/.node-version"

    if [ ! -d "$dir/node_modules" ]; then
        log "Instalando dependências do $label..."
        (cd "$dir" && npm install)
        printf '%s\n' "$current_node" > "$stamp_file" 2>/dev/null || true
        return
    fi

    previous_node="$(cat "$stamp_file" 2>/dev/null || true)"
    if [ -z "$previous_node" ] || [ "$previous_node" != "$current_node" ]; then
        log "Rebuild de dependências do $label (Node $current_node)..."
        (cd "$dir" && npm rebuild)
        printf '%s\n' "$current_node" > "$stamp_file" 2>/dev/null || true
    fi
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
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Dependências faltando: ${missing_deps[*]}"
        echo "Por favor, instale as dependências antes de continuar."
        exit 1
    fi

    # Prisma (e a toolchain do projeto) tende a suportar apenas versoes LTS do Node.
    # Falhar cedo evita erros opacos como "Schema engine error".
    local node_version node_major
    node_version="$(node -v 2>/dev/null || true)"
    node_major="${node_version#v}"
    node_major="${node_major%%.*}"
    if [[ -n "$node_major" && "$node_major" -ge 23 ]]; then
        error "Node.js $node_version nao e suportado para este ambiente de dev."
        echo "Troque para Node.js 20 LTS (recomendado) ou 22 LTS e rode novamente."
        exit 1
    fi

    # Docker daemon precisa estar ativo. No macOS isso normalmente significa Docker Desktop aberto.
    if ! docker info >/dev/null 2>&1; then
        if [ "$(uname -s 2>/dev/null)" = "Darwin" ] && command_exists open; then
            warn "Docker daemon nao esta rodando; tentando iniciar o Docker Desktop..."
            open -ga Docker >/dev/null 2>&1 || true

            # Aguarda o daemon ficar pronto (timeout ~2min).
            for _ in {1..60}; do
                if docker info >/dev/null 2>&1; then
                    break
                fi
                sleep 2
            done
        fi
    fi
    if ! docker info >/dev/null 2>&1; then
        error "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?"
        echo "Dica: no macOS, abra o Docker Desktop e aguarde ele ficar pronto."
        exit 1
    fi
    
    log "Todas as dependências estão instaladas ✓"
}

# Função para verificar se as portas estão disponíveis
check_ports() {
    log "Verificando portas disponíveis..."
    
    local ports=(3000 3001 5432)
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

# Função para instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    
    ensure_deps "." "projeto raiz"
    ensure_deps "backend" "backend"
    ensure_deps "frontend" "frontend"
    
    log "Dependências instaladas ✓"
}

# Função para setup do banco de dados
setup_database() {
    log "Configurando banco de dados..."
    
    # Verificar se o arquivo .env existe
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            log "Copiando .env.example para .env..."
            cp backend/.env.example backend/.env
            warn "Por favor, configure as variáveis de ambiente em backend/.env (DATABASE_URL precisa bater com docker-compose.dev.yml)"
        else
            error "Arquivo .env.example não encontrado!"
            exit 1
        fi
    fi

    # Se o DATABASE_URL esta com placeholder, ajusta para os defaults do docker-compose.dev.yml
    if grep -q 'postgresql://username:password@localhost:5432/swimflow_db' backend/.env 2>/dev/null; then
        warn "DATABASE_URL em backend/.env esta com placeholder; ajustando para swimflow_user/swimflow_pass."
        sed -i.bak 's|postgresql://username:password@localhost:5432/swimflow_db|postgresql://swimflow_user:swimflow_pass@localhost:5432/swimflow_db|g' backend/.env
        rm -f backend/.env.bak
    fi
    
    # Iniciar banco de dados com Docker
    log "Iniciando banco de dados PostgreSQL..."
    docker-compose -f docker-compose.dev.yml up -d postgres
    
    # Aguardar o banco estar pronto
    log "Aguardando banco de dados ficar pronto..."
    sleep 10
    
    # Executar migrations
    log "Executando migrations..."
    (cd backend && npx prisma migrate dev --name init)
    
    # Executar seed
    log "Populando banco com dados de desenvolvimento..."
    (cd backend && npx prisma db seed)
    
    log "Banco de dados configurado ✓"
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
    (cd backend && npx prisma generate)
    
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
            check_ports
            install_dependencies
            setup_database
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
            install_dependencies
            setup_database
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
