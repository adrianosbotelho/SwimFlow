#!/bin/bash

# SwimFlow Database Setup Script
# Este script configura o banco de dados PostgreSQL para o SwimFlow

set -e

echo "🏊 SwimFlow Database Setup"
echo "=========================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do banco
DB_NAME="swimflow_db"
DB_USER="swimflow_user"
DB_PASSWORD="swimflow_pass"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}Verificando se PostgreSQL está instalado...${NC}"

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL não encontrado!${NC}"
    echo -e "${YELLOW}Por favor, instale PostgreSQL primeiro:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Windows: Baixe do site oficial postgresql.org"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL encontrado${NC}"

# Verificar se o serviço está rodando
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL não está rodando. Tentando iniciar...${NC}"
    
    # Tentar iniciar o serviço (funciona na maioria dos sistemas)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    elif command -v brew &> /dev/null; then
        brew services start postgresql
    else
        echo -e "${RED}❌ Não foi possível iniciar PostgreSQL automaticamente${NC}"
        echo "Por favor, inicie o serviço PostgreSQL manualmente e execute este script novamente."
        exit 1
    fi
    
    # Aguardar um pouco para o serviço iniciar
    sleep 3
    
    if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        echo -e "${RED}❌ PostgreSQL ainda não está respondendo${NC}"
        echo "Por favor, verifique se o serviço está rodando corretamente."
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"

# Função para executar comandos SQL como superuser
run_sql_as_superuser() {
    local sql="$1"
    sudo -u postgres psql -c "$sql" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Tentando como usuário atual...${NC}"
        psql -U postgres -c "$sql" 2>/dev/null || {
            echo -e "${RED}❌ Erro ao executar: $sql${NC}"
            return 1
        }
    }
}

echo -e "${BLUE}Criando usuário do banco de dados...${NC}"

# Criar usuário se não existir
if run_sql_as_superuser "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" | grep -q 1; then
    echo -e "${YELLOW}⚠️  Usuário '$DB_USER' já existe${NC}"
else
    run_sql_as_superuser "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    echo -e "${GREEN}✅ Usuário '$DB_USER' criado${NC}"
fi

echo -e "${BLUE}Criando banco de dados...${NC}"

# Criar banco se não existir
if run_sql_as_superuser "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" | grep -q 1; then
    echo -e "${YELLOW}⚠️  Banco '$DB_NAME' já existe${NC}"
else
    run_sql_as_superuser "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo -e "${GREEN}✅ Banco '$DB_NAME' criado${NC}"
fi

echo -e "${BLUE}Configurando permissões...${NC}"

# Dar permissões ao usuário
run_sql_as_superuser "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
run_sql_as_superuser "ALTER USER $DB_USER CREATEDB;"

echo -e "${GREEN}✅ Permissões configuradas${NC}"

# Verificar conexão
echo -e "${BLUE}Testando conexão...${NC}"

export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✅ Conexão com o banco funcionando!${NC}"
else
    echo -e "${RED}❌ Erro ao conectar com o banco${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Configuração do banco concluída com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 Informações do banco:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo -e "${BLUE}🔗 String de conexão:${NC}"
echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "  1. cd backend"
echo "  2. npm install"
echo "  3. npx prisma generate"
echo "  4. npx prisma migrate dev"
echo "  5. npx prisma db seed"
echo ""