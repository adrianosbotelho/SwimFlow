# 🚀 Guia de Deploy - SwimFlow no Render

## Pré-requisitos

1. ✅ Conta no [Render](https://render.com)
2. ✅ Repositório GitHub com o código (já feito!)
3. ✅ Arquivos de configuração criados

## 📋 Passos para Deploy

### 1. Conectar Repositório no Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Blueprint"**
3. Conecte seu repositório GitHub `SwimFlow`
4. O Render detectará automaticamente o arquivo `render.yaml`

### 2. Configuração Automática

O arquivo `render.yaml` já está configurado para criar:

- 🗄️ **Database PostgreSQL** (Plano Free)
- 🔧 **Backend API** (Node.js)
- 🎨 **Frontend** (Static Site)

### 3. Variáveis de Ambiente

As seguintes variáveis serão configuradas automaticamente:

**Backend:**
- `DATABASE_URL` - Conectado automaticamente ao PostgreSQL
- `JWT_ACCESS_SECRET` - Gerado automaticamente
- `JWT_REFRESH_SECRET` - Gerado automaticamente
- `NODE_ENV=production`
- `PORT=10000`
- `FRONTEND_URL` - URL do frontend

**Frontend:**
- `VITE_API_URL` - URL do backend

### 4. Processo de Build

**Backend:**
```bash
cd backend && npm install && npm run build && npx prisma generate
```

**Frontend:**
```bash
cd frontend && npm install && npm run build
```

### 5. Inicialização

**Backend:**
```bash
cd backend && npx prisma migrate deploy && npm start
```

O sistema executará automaticamente:
- Migrations do banco de dados
- Seed com dados iniciais
- Inicialização do servidor

## 🔐 Credenciais Padrão

Após o deploy, você poderá fazer login com:

**Administrador:**
- Email: `admin@swimflow.com`
- Senha: `admin123`

**Professores:**
- Email: `carlos.silva@swimflow.com` / Senha: `prof123`
- Email: `ana.santos@swimflow.com` / Senha: `prof123`

## 📡 URLs de Acesso

Após o deploy, você terá:

- **Frontend:** `https://swimflow-frontend.onrender.com`
- **Backend API:** `https://swimflow-backend.onrender.com`
- **Health Check:** `https://swimflow-backend.onrender.com/health`

## 🔧 Configurações de Produção

### Segurança
- ✅ CORS configurado para domínios Render
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet para headers de segurança
- ✅ JWT com secrets auto-gerados

### Performance
- ✅ Build otimizado do React
- ✅ Code splitting automático
- ✅ Compressão de assets
- ✅ Cache de dependências

### Banco de Dados
- ✅ PostgreSQL gerenciado
- ✅ Migrations automáticas
- ✅ Seed com dados de exemplo
- ✅ Backup automático (Render)

## 🐛 Troubleshooting

### Build Falha
- Verifique os logs no Render Dashboard
- Confirme que todas as dependências estão no `package.json`

### Database Connection
- Verifique se o PostgreSQL foi criado
- Confirme que `DATABASE_URL` está configurada

### CORS Errors
- Verifique se `FRONTEND_URL` está correta
- Confirme que os domínios estão na whitelist

## 📊 Monitoramento

### Health Checks
- Backend: `GET /health`
- Retorna status do servidor e timestamp

### Logs
- Acesse logs em tempo real no Render Dashboard
- Monitore erros e performance

## 🔄 Atualizações

Para atualizar o sistema:

1. Faça push das alterações para o GitHub
2. O Render fará deploy automático
3. Migrations serão executadas automaticamente

## 💰 Custos

**Plano Free Render:**
- ✅ Backend: Gratuito (com limitações)
- ✅ Frontend: Gratuito
- ✅ PostgreSQL: 1GB gratuito
- ⚠️ Sleep após 15min de inatividade

**Para produção real, considere:**
- Plano pago para evitar sleep
- Mais recursos de CPU/RAM
- Backup avançado

## 🎯 Próximos Passos

Após o deploy:

1. ✅ Teste todas as funcionalidades
2. ✅ Configure domínio personalizado (opcional)
3. ✅ Configure monitoramento
4. ✅ Implemente CI/CD avançado
5. ✅ Continue desenvolvimento dos próximos módulos

---

**🏊‍♂️ SwimFlow está pronto para produção!**