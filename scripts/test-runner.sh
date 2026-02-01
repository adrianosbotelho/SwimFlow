#!/bin/bash

# SwimFlow Test Automation Script
# Este script automatiza a execução de testes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
COVERAGE_DIR="coverage"
REPORTS_DIR="test-reports"

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

# Função para executar testes do backend
test_backend() {
    log "Executando testes do backend..."
    
    cd backend
    
    # Verificar se há testes
    if [ ! -d "src/__tests__" ] && [ ! -d "src/**/__tests__" ]; then
        warn "Nenhum teste encontrado no backend"
        cd ..
        return 0
    fi
    
    # Executar testes
    npm run test
    
    cd ..
    log "Testes do backend concluídos ✓"
}

# Função para executar testes do frontend
test_frontend() {
    log "Executando testes do frontend..."
    
    cd frontend
    
    # Verificar se há testes
    if [ ! -d "src/__tests__" ] && [ ! -d "src/**/__tests__" ]; then
        warn "Nenhum teste encontrado no frontend"
        cd ..
        return 0
    fi
    
    # Executar testes
    npm run test
    
    cd ..
    log "Testes do frontend concluídos ✓"
}

# Função para executar testes com coverage
test_with_coverage() {
    log "Executando testes com cobertura de código..."
    
    # Criar diretório de relatórios
    mkdir -p $REPORTS_DIR
    
    # Backend coverage
    log "Cobertura do backend..."
    cd backend
    if [ -d "src/__tests__" ] || [ -d "src/**/__tests__" ]; then
        npm run test -- --coverage --coverageDirectory="../$COVERAGE_DIR/backend"
    fi
    cd ..
    
    # Frontend coverage
    log "Cobertura do frontend..."
    cd frontend
    if [ -d "src/__tests__" ] || [ -d "src/**/__tests__" ]; then
        npm run test -- --coverage --coverageDirectory="../$COVERAGE_DIR/frontend"
    fi
    cd ..
    
    log "Relatórios de cobertura gerados ✓"
    info "Veja os relatórios em:"
    echo "  Backend: $COVERAGE_DIR/backend/lcov-report/index.html"
    echo "  Frontend: $COVERAGE_DIR/frontend/lcov-report/index.html"
}

# Função para executar testes de integração
test_integration() {
    log "Executando testes de integração..."
    
    # Verificar se o banco de teste está configurado
    if [ ! -f "backend/.env.test" ]; then
        warn "Arquivo .env.test não encontrado. Criando..."
        cp backend/.env.example backend/.env.test
        echo "Por favor, configure as variáveis de ambiente de teste em backend/.env.test"
    fi
    
    # Iniciar banco de teste
    log "Iniciando banco de dados de teste..."
    docker-compose -f docker-compose.test.yml up -d postgres-test 2>/dev/null || {
        warn "docker-compose.test.yml não encontrado, usando banco de desenvolvimento"
    }
    
    # Aguardar banco estar pronto
    sleep 5
    
    # Executar migrations no banco de teste
    cd backend
    export NODE_ENV=test
    npx prisma migrate deploy
    cd ..
    
    # Executar testes de integração
    cd backend
    npm run test -- --testPathPattern=integration
    cd ..
    
    log "Testes de integração concluídos ✓"
}

# Função para executar testes E2E
test_e2e() {
    log "Executando testes E2E..."
    
    # Verificar se Playwright ou Cypress está configurado
    if [ -f "frontend/playwright.config.ts" ]; then
        log "Executando testes Playwright..."
        cd frontend
        npx playwright test
        cd ..
    elif [ -f "frontend/cypress.config.ts" ]; then
        log "Executando testes Cypress..."
        cd frontend
        npx cypress run
        cd ..
    else
        warn "Nenhum framework de teste E2E configurado"
        return 0
    fi
    
    log "Testes E2E concluídos ✓"
}

# Função para executar testes de performance
test_performance() {
    log "Executando testes de performance..."
    
    # Verificar se a aplicação está rodando
    if ! curl -f http://localhost:3001/health >/dev/null 2>&1; then
        error "Backend não está rodando. Inicie com './scripts/dev.sh start'"
        exit 1
    fi
    
    # Usar Artillery ou similar para testes de carga
    if command -v artillery >/dev/null 2>&1; then
        log "Executando testes de carga com Artillery..."
        
        # Criar arquivo de configuração básico se não existir
        if [ ! -f "artillery.yml" ]; then
            cat > artillery.yml << EOF
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/health"
  - name: "Get students"
    requests:
      - get:
          url: "/api/students"
EOF
        fi
        
        artillery run artillery.yml --output $REPORTS_DIR/performance.json
        artillery report $REPORTS_DIR/performance.json --output $REPORTS_DIR/performance.html
        
        log "Relatório de performance gerado: $REPORTS_DIR/performance.html"
    else
        warn "Artillery não instalado. Instale com: npm install -g artillery"
    fi
    
    log "Testes de performance concluídos ✓"
}

# Função para executar lint
run_lint() {
    log "Executando lint..."
    
    local has_errors=false
    
    # Lint do backend
    log "Lint do backend..."
    cd backend
    if ! npm run lint; then
        has_errors=true
    fi
    cd ..
    
    # Lint do frontend
    log "Lint do frontend..."
    cd frontend
    if ! npm run lint; then
        has_errors=true
    fi
    cd ..
    
    if [ "$has_errors" = true ]; then
        error "Lint encontrou problemas"
        echo "Execute 'npm run lint:fix' para corrigir automaticamente"
        exit 1
    fi
    
    log "Lint passou ✓"
}

# Função para executar verificação de tipos
check_types() {
    log "Verificando tipos TypeScript..."
    
    local has_errors=false
    
    # Type check do backend
    log "Verificando tipos do backend..."
    cd backend
    if ! npx tsc --noEmit; then
        has_errors=true
    fi
    cd ..
    
    # Type check do frontend
    log "Verificando tipos do frontend..."
    cd frontend
    if ! npm run type-check; then
        has_errors=true
    fi
    cd ..
    
    if [ "$has_errors" = true ]; then
        error "Verificação de tipos falhou"
        exit 1
    fi
    
    log "Verificação de tipos passou ✓"
}

# Função para executar todos os testes
test_all() {
    log "🧪 Executando suite completa de testes..."
    
    # Verificar tipos
    check_types
    
    # Lint
    run_lint
    
    # Testes unitários
    test_backend
    test_frontend
    
    # Testes de integração
    test_integration
    
    # Gerar relatório de cobertura
    test_with_coverage
    
    log "✅ Todos os testes concluídos com sucesso!"
}

# Função para executar testes em modo watch
test_watch() {
    local component="$1"
    
    case "$component" in
        "backend")
            log "Iniciando testes do backend em modo watch..."
            cd backend && npm run test:watch
            ;;
        "frontend")
            log "Iniciando testes do frontend em modo watch..."
            cd frontend && npm run test:watch
            ;;
        *)
            error "Especifique 'backend' ou 'frontend' para modo watch"
            exit 1
            ;;
    esac
}

# Função para limpar arquivos de teste
clean_test_files() {
    log "Limpando arquivos de teste..."
    
    # Remover coverage
    rm -rf $COVERAGE_DIR
    
    # Remover relatórios
    rm -rf $REPORTS_DIR
    
    # Remover arquivos temporários de teste
    find . -name "*.test.js.snap" -delete
    find . -name "test-results" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log "Arquivos de teste limpos ✓"
}

# Função para mostrar estatísticas de teste
show_test_stats() {
    info "=== Estatísticas de Teste ==="
    
    # Contar arquivos de teste
    local backend_tests=$(find backend -name "*.test.ts" -o -name "*.test.js" 2>/dev/null | wc -l)
    local frontend_tests=$(find frontend -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l)
    
    echo "Arquivos de teste:"
    echo "  Backend: $backend_tests"
    echo "  Frontend: $frontend_tests"
    echo "  Total: $((backend_tests + frontend_tests))"
    
    # Mostrar cobertura se disponível
    if [ -f "$COVERAGE_DIR/backend/coverage-summary.json" ]; then
        echo ""
        echo "Cobertura do Backend:"
        cat "$COVERAGE_DIR/backend/coverage-summary.json" | grep -o '"pct":[0-9.]*' | head -4
    fi
    
    if [ -f "$COVERAGE_DIR/frontend/coverage-summary.json" ]; then
        echo ""
        echo "Cobertura do Frontend:"
        cat "$COVERAGE_DIR/frontend/coverage-summary.json" | grep -o '"pct":[0-9.]*' | head -4
    fi
}

# Função principal
main() {
    case "${1:-all}" in
        "all")
            test_all
            ;;
        "backend")
            test_backend
            ;;
        "frontend")
            test_frontend
            ;;
        "integration")
            test_integration
            ;;
        "e2e")
            test_e2e
            ;;
        "performance")
            test_performance
            ;;
        "coverage")
            test_with_coverage
            ;;
        "lint")
            run_lint
            ;;
        "types")
            check_types
            ;;
        "watch")
            test_watch "$2"
            ;;
        "clean")
            clean_test_files
            ;;
        "stats")
            show_test_stats
            ;;
        "help"|"-h"|"--help")
            echo "SwimFlow Test Runner Script"
            echo ""
            echo "Uso: ./scripts/test-runner.sh [comando] [argumentos]"
            echo ""
            echo "Comandos disponíveis:"
            echo "  all          - Executa todos os testes (padrão)"
            echo "  backend      - Executa apenas testes do backend"
            echo "  frontend     - Executa apenas testes do frontend"
            echo "  integration  - Executa testes de integração"
            echo "  e2e          - Executa testes E2E"
            echo "  performance  - Executa testes de performance"
            echo "  coverage     - Executa testes com cobertura"
            echo "  lint         - Executa lint"
            echo "  types        - Verifica tipos TypeScript"
            echo "  watch <comp> - Executa testes em modo watch (backend|frontend)"
            echo "  clean        - Limpa arquivos de teste"
            echo "  stats        - Mostra estatísticas de teste"
            echo "  help         - Mostra esta ajuda"
            ;;
        *)
            error "Comando desconhecido: $1"
            echo "Execute './scripts/test-runner.sh help' para ver os comandos disponíveis."
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"