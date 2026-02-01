# Sistema de Autenticação SwimFlow

## Funcionalidades Implementadas

### 🔐 Login
- Tela de login profissional com validação
- Autenticação JWT com refresh tokens
- Funcionalidade "Lembrar-me"
- Tratamento de erros e loading states

### 📝 Cadastro/Registro
- Formulário de registro completo
- Validação de dados (nome, email, senha, confirmação)
- Seleção de tipo de conta (Professor/Administrador)
- Auto-login após registro bem-sucedido

### 🔑 Recuperação de Senha
- Fluxo completo de recuperação de senha
- Envio de email com token de reset (simulado em desenvolvimento)
- Validação de token de reset
- Redefinição segura de senha

## Como Usar

### Para Usuários Finais

1. **Primeiro Acesso:**
   - Clique em "Criar conta" na tela de login
   - Preencha seus dados (nome, email, senha)
   - Escolha o tipo de conta (Professor ou Administrador)
   - Clique em "Criar Conta"

2. **Login:**
   - Digite seu email e senha
   - Marque "Lembrar-me" se desejar permanecer logado
   - Clique em "Entrar"

3. **Esqueceu a Senha:**
   - Clique em "Esqueceu a senha?" na tela de login
   - Digite seu email
   - Verifique o console do navegador para o link de reset (em desenvolvimento)
   - Acesse o link e defina uma nova senha

### Para Desenvolvedores

#### Endpoints da API

```typescript
// Registro
POST /api/auth/register
{
  "name": "Nome Completo",
  "email": "email@exemplo.com",
  "password": "senha123",
  "confirmPassword": "senha123",
  "role": "professor" // ou "admin"
}

// Login
POST /api/auth/login
{
  "email": "email@exemplo.com",
  "password": "senha123"
}

// Recuperação de senha
POST /api/auth/forgot-password
{
  "email": "email@exemplo.com"
}

// Reset de senha
POST /api/auth/reset-password
{
  "token": "jwt-reset-token",
  "newPassword": "novaSenha123",
  "confirmPassword": "novaSenha123"
}
```

#### Componentes React

- `LoginForm` - Formulário de login
- `RegisterForm` - Formulário de cadastro
- `ForgotPasswordForm` - Formulário de recuperação de senha
- `ResetPasswordForm` - Formulário de redefinição de senha
- `AuthContainer` - Container que gerencia os estados de autenticação

#### AuthService

```typescript
import authService from '../services/authService';

// Registro
await authService.register({
  name: 'Nome',
  email: 'email@exemplo.com',
  password: 'senha123',
  confirmPassword: 'senha123',
  role: 'professor'
});

// Login
await authService.login({
  email: 'email@exemplo.com',
  password: 'senha123',
  rememberMe: true
});

// Verificar se está autenticado
const isLoggedIn = authService.isAuthenticated();

// Obter usuário atual
const user = authService.getUser();

// Logout
await authService.logout();
```

## Segurança

- ✅ Senhas hasheadas com bcrypt (12 rounds)
- ✅ JWT tokens com expiração (15min access, 7 dias refresh)
- ✅ Tokens de reset com expiração de 1 hora
- ✅ Proteção contra enumeração de emails
- ✅ Validação de entrada em todos os endpoints
- ✅ Refresh automático de tokens
- ✅ Armazenamento seguro (localStorage vs sessionStorage)

## Próximos Passos

- [ ] Integração com serviço de email real
- [ ] Autenticação social (Google, Facebook)
- [ ] Verificação de email no registro
- [ ] Política de senhas mais robusta
- [ ] Rate limiting por IP
- [ ] Logs de auditoria de autenticação

## Usuários de Teste

O sistema já possui usuários pré-cadastrados via seed:

```
Admin:
- Email: admin@swimflow.com
- Senha: admin123

Professor:
- Email: professor@swimflow.com  
- Senha: professor123
```

Ou você pode criar uma nova conta usando o formulário de registro.