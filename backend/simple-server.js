const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Simple auth middleware (for testing)
const simpleAuth = (req, res, next) => {
  // For testing, just pass through
  req.user = { id: 'test', email: 'test@test.com', role: 'admin' };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Roles routes
app.get('/api/roles', simpleAuth, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/roles', simpleAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome da função é obrigatório' });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim() }
    });

    if (existingRole) {
      return res.status(409).json({ error: 'Já existe uma função com esse nome' });
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/roles/:id', simpleAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ error: 'Função não encontrada' });
    }

    if (['admin', 'professor'].includes(role.name)) {
      return res.status(400).json({ error: 'Não é possível desativar funções padrão do sistema' });
    }

    await prisma.role.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deactivating role:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Initialize default roles
async function initializeDefaultRoles() {
  const defaultRoles = [
    { name: 'admin', description: 'Administrador do sistema' },
    { name: 'professor', description: 'Professor de natação' }
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name }
    });
    
    if (!existingRole) {
      await prisma.role.create({ data: roleData });
      console.log(`✅ Função padrão criada: ${roleData.name}`);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`🏊‍♂️ Simple SwimFlow API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  
  try {
    await initializeDefaultRoles();
    console.log('✅ Default roles initialized');
  } catch (error) {
    console.error('❌ Error initializing default roles:', error);
  }
});