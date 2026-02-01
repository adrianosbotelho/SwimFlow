#!/bin/bash

# SwimFlow Database Management Script
# Este script automatiza operações do banco de dados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BACKUP_DIR="backups"
MIGRATIONS_DIR="backend/prisma/migrations"

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

# Função para verificar se o banco está rodando
check_database() {
    log "Verificando conexão com o banco de dados..."
    
    cd backend
    if npx prisma db pull --force >/dev/null 2>&1; then
        log "Conexão com banco de dados OK ✓"
    else
        error "Não foi possível conectar ao banco de dados"
        echo "Verifique se:"
        echo "1. O PostgreSQL está rodando"
        echo "2. As variáveis de ambiente estão corretas"
        echo "3. O arquivo .env está configurado"
        exit 1
    fi
    cd ..
}

# Função para fazer backup
backup_database() {
    log "Fazendo backup do banco de dados..."
    
    # Criar diretório de backup se não existir
    mkdir -p $BACKUP_DIR
    
    # Nome do arquivo de backup
    local backup_file="$BACKUP_DIR/swimflow_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    cd backend
    
    # Verificar se DATABASE_URL está definida
    if [ -z "$DATABASE_URL" ]; then
        # Tentar carregar do .env
        if [ -f ".env" ]; then
            export $(grep -v '^#' .env | xargs)
        fi
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "../$backup_file"
        log "Backup salvo em: $backup_file"
    else
        error "DATABASE_URL não definida"
        exit 1
    fi
    
    cd ..
}

# Função para restaurar backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        # Listar backups disponíveis
        echo "Backups disponíveis:"
        ls -la $BACKUP_DIR/*.sql 2>/dev/null || echo "Nenhum backup encontrado"
        echo ""
        echo "Uso: ./scripts/db-manager.sh restore <arquivo_backup>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Arquivo de backup não encontrado: $backup_file"
        exit 1
    fi
    
    log "Restaurando backup: $backup_file"
    
    cd backend
    
    # Verificar se DATABASE_URL está definida
    if [ -z "$DATABASE_URL" ]; then
        if [ -f ".env" ]; then
            export $(grep -v '^#' .env | xargs)
        fi
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        # Confirmar antes de restaurar
        echo "ATENÇÃO: Esta operação irá sobrescrever todos os dados atuais!"
        echo "Deseja continuar? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            log "Operação cancelada"
            exit 0
        fi
        
        # Restaurar backup
        psql "$DATABASE_URL" < "../$backup_file"
        log "Backup restaurado com sucesso ✓"
    else
        error "DATABASE_URL não definida"
        exit 1
    fi
    
    cd ..
}

# Função para resetar banco de dados
reset_database() {
    log "Resetando banco de dados..."
    
    echo "ATENÇÃO: Esta operação irá apagar todos os dados!"
    echo "Deseja continuar? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log "Operação cancelada"
        exit 0
    fi
    
    # Fazer backup antes de resetar
    backup_database
    
    cd backend
    
    # Reset do Prisma
    npx prisma migrate reset --force
    
    # Executar seed
    npx prisma db seed
    
    cd ..
    
    log "Banco de dados resetado ✓"
}

# Função para executar migrations
migrate_database() {
    log "Executando migrations..."
    
    cd backend
    
    # Verificar se há migrations pendentes
    if npx prisma migrate status | grep -q "Following migration have not yet been applied"; then
        log "Há migrations pendentes. Executando..."
        npx prisma migrate deploy
    else
        log "Nenhuma migration pendente"
    fi
    
    # Gerar cliente Prisma
    npx prisma generate
    
    cd ..
    
    log "Migrations executadas ✓"
}

# Função para criar nova migration
create_migration() {
    local migration_name="$1"
    
    if [ -z "$migration_name" ]; then
        error "Nome da migration é obrigatório"
        echo "Uso: ./scripts/db-manager.sh migrate:create <nome_da_migration>"
        exit 1
    fi
    
    log "Criando nova migration: $migration_name"
    
    cd backend
    npx prisma migrate dev --name "$migration_name"
    cd ..
    
    log "Migration criada ✓"
}

# Função para executar seed
seed_database() {
    log "Populando banco com dados de desenvolvimento..."
    
    cd backend
    npx prisma db seed
    cd ..
    
    log "Seed executado ✓"
}

# Função para abrir Prisma Studio
open_studio() {
    log "Abrindo Prisma Studio..."
    
    cd backend
    npx prisma studio
    cd ..
}

# Função para mostrar status do banco
show_status() {
    info "=== Status do Banco de Dados ==="
    
    cd backend
    
    # Status da conexão
    if npx prisma db pull --force >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Conexão: OK${NC}"
    else
        echo -e "${RED}✗ Conexão: Falhou${NC}"
    fi
    
    # Status das migrations
    local migration_status=$(npx prisma migrate status 2>/dev/null || echo "Erro ao verificar migrations")
    echo "Migrations: $migration_status"
    
    # Informações do schema
    echo ""
    info "Tabelas no banco:"
    npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "Erro ao listar tabelas"
    
    cd ..
    
    echo ""
    info "Backups disponíveis:"
    ls -la $BACKUP_DIR/*.sql 2>/dev/null | tail -5 || echo "Nenhum backup encontrado"
}

# Função para limpar backups antigos
cleanup_backups() {
    local days=${1:-30}
    
    log "Limpando backups com mais de $days dias..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$days -delete
        log "Backups antigos removidos ✓"
    else
        log "Diretório de backup não existe"
    fi
}

# Função para verificar integridade
check_integrity() {
    log "Verificando integridade do banco de dados..."
    
    cd backend
    
    # Verificar se o schema está sincronizado
    if npx prisma db pull --force >/dev/null 2>&1; then
        log "Schema sincronizado ✓"
    else
        warn "Schema pode estar dessincronizado"
    fi
    
    # Verificar constraints
    npx prisma db execute --stdin <<< "
        SELECT 
            conname as constraint_name,
            contype as constraint_type,
            pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY conname;
    " 2>/dev/null || warn "Erro ao verificar constraints"
    
    cd ..
    
    log "Verificação de integridade concluída ✓"
}

# Função principal
main() {
    case "${1:-status}" in
        "backup")
            check_database
            backup_database
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "reset")
            check_database
            reset_database
            ;;
        "migrate")
            check_database
            migrate_database
            ;;
        "migrate:create")
            create_migration "$2"
            ;;
        "seed")
            check_database
            seed_database
            ;;
        "studio")
            open_studio
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup_backups "$2"
            ;;
        "integrity")
            check_integrity
            ;;
        "help"|"-h"|"--help")
            echo "SwimFlow Database Management Script"
            echo ""
            echo "Uso: ./scripts/db-manager.sh [comando] [argumentos]"
            echo ""
            echo "Comandos disponíveis:"
            echo "  backup           - Faz backup do banco de dados"
            echo "  restore <file>   - Restaura backup do banco"
            echo "  reset            - Reseta o banco (apaga tudo e recria)"
            echo "  migrate          - Executa migrations pendentes"
            echo "  migrate:create   - Cria nova migration"
            echo "  seed             - Popula banco com dados de desenvolvimento"
            echo "  studio           - Abre Prisma Studio"
            echo "  status           - Mostra status do banco (padrão)"
            echo "  cleanup [days]   - Remove backups antigos (padrão: 30 dias)"
            echo "  integrity        - Verifica integridade do banco"
            echo "  help             - Mostra esta ajuda"
            ;;
        *)
            error "Comando desconhecido: $1"
            echo "Execute './scripts/db-manager.sh help' para ver os comandos disponíveis."
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"