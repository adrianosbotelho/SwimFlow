# SwimFlow Backend API

## 🚀 Deploy no Render

Este backend está configurado para deploy automático no Render.

### Configuração de Produção

- ✅ Host: `0.0.0.0` (requerido pelo Render)
- ✅ Port: `process.env.PORT` (configurado automaticamente)
- ✅ Database: PostgreSQL via `DATABASE_URL`
- ✅ JWT Secrets: Auto-gerados pelo Render
- ✅ CORS: Configurado para domínios Render

### Scripts de Deploy

```bash
# Build
npm run build

# Deploy (migrations + seed)
npm run deploy

# Start production
npm start
```

### Variáveis de Ambiente Necessárias

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=auto-generated
JWT_REFRESH_SECRET=auto-generated
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://swimflow-frontend.onrender.com
```

### Health Check

- **Endpoint:** `GET /health`
- **Verifica:** Conexão com banco de dados
- **Retorna:** Status do sistema

### API Endpoints

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

#### Usuários
- `GET /api/users` - Listar usuários (admin)
- `POST /api/users` - Criar usuário (admin)
- `GET /api/users/:id` - Obter usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário (admin)
- `GET /api/users/:id/stats` - Estatísticas do usuário

### Credenciais Padrão

**Admin:**
- Email: `admin@swimflow.com`
- Senha: `admin123`

**Professores:**
- Email: `carlos.silva@swimflow.com` / Senha: `prof123`
- Email: `ana.santos@swimflow.com` / Senha: `prof123`