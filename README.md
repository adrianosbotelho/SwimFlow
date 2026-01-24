# SwimFlow Management System

Sistema web moderno para gestão e acompanhamento de alunos de natação, voltado para professores, academias e escolas de natação.

## 🏊‍♂️ Sobre o Projeto

SwimFlow é um sistema completo que facilita o acompanhamento da evolução técnica dos alunos através de uma interface limpa, simples e profissional que prioriza usabilidade, organização das informações e clareza para o professor.

## 🚀 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Framer Motion** para animações
- **Zustand** para gerenciamento de estado
- **React Router** para navegação
- **Chart.js** para gráficos e visualizações

### Backend
- **Node.js** com Express.js
- **TypeScript** para type safety
- **Prisma ORM** com PostgreSQL
- **JWT** para autenticação
- **Joi** para validação de dados
- **Multer** para upload de arquivos

### Ferramentas de Desenvolvimento
- **ESLint** e **Prettier** para qualidade de código
- **Husky** e **lint-staged** para git hooks
- **Jest** e **Vitest** para testes
- **fast-check** para property-based testing

## 📁 Estrutura do Projeto

```
swimflow-management/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Serviços de API
│   │   ├── store/          # Gerenciamento de estado
│   │   ├── types/          # Definições de tipos
│   │   └── utils/          # Utilitários
│   └── ...
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/    # Controladores da API
│   │   ├── middleware/     # Middlewares
│   │   ├── models/         # Modelos de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica de negócio
│   │   └── utils/          # Utilitários
│   ├── prisma/             # Schema e migrations
│   └── ...
└── scripts/                # Scripts de setup
```

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd swimflow-management
   ```

2. **Instale as dependências**
   ```bash
   # Dependências do projeto principal
   npm install
   
   # Dependências do backend
   cd backend && npm install
   
   # Dependências do frontend
   cd ../frontend && npm install
   ```

3. **Configure o banco de dados**
   ```bash
   # Copie o arquivo de exemplo
   cp backend/.env.example backend/.env
   
   # Edite o arquivo .env com suas configurações
   # DATABASE_URL="postgresql://username:password@localhost:5432/swimflow_db"
   ```

4. **Execute as migrations**
   ```bash
   npm run db:migrate
   ```

5. **Popule o banco com dados de exemplo**
   ```bash
   npm run db:seed
   ```

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
# Executa frontend e backend simultaneamente
npm run dev

# Ou execute separadamente:
npm run dev:backend    # Backend na porta 3001
npm run dev:frontend   # Frontend na porta 3000
```

### Build para Produção
```bash
npm run build
```

### Testes
```bash
# Executa todos os testes
npm run test

# Testes em modo watch
npm run test:backend -- --watch
npm run test:frontend -- --watch
```

### Linting e Formatação
```bash
# Verifica e corrige problemas de código
npm run lint:fix

# Formata o código
npm run format
```

## 🗄️ Banco de Dados

### Comandos Úteis
```bash
# Visualizar o banco de dados
npm run db:studio

# Reset completo do banco
npm run db:reset

# Gerar cliente Prisma após mudanças no schema
cd backend && npm run db:generate
```

## 🎨 Design System

O projeto utiliza uma paleta de cores inspirada no oceano:

- **Ocean Blue**: Tons principais de azul oceano
- **Teal**: Acentos em verde-azulado
- **Coral/Amber**: Cores vibrantes para destaques
- **Grays**: Tons neutros para texto e backgrounds

## 📊 Funcionalidades Principais

- ✅ **Gestão de Alunos**: Cadastro completo com fotos e informações
- ✅ **Gestão de Professores**: Controle de acesso e perfis
- ✅ **Organização de Turmas**: Associação de alunos e piscinas
- ✅ **Registro de Treinos**: Documentação de atividades
- ✅ **Sistema de Avaliações**: Acompanhamento por tipo de nado
- ✅ **Evolução Visual**: Gráficos e relatórios de progresso
- ✅ **Níveis de Habilidade**: Classificação e progressão
- ✅ **Dashboard Intuitivo**: Visão geral do sistema

## 🧪 Estratégia de Testes

O projeto utiliza uma abordagem dual de testes:

- **Testes Unitários**: Jest/Vitest para lógica específica
- **Property-Based Testing**: fast-check para propriedades universais
- **Testes de Integração**: Fluxos completos da aplicação

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Suporte

Para suporte, entre em contato através dos issues do GitHub ou envie um email para a equipe de desenvolvimento.

---

Desenvolvido com 💙 pela equipe SwimFlow