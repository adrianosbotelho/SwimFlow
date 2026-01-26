const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoles() {
  try {
    console.log('🧪 Testando sistema de funções...');
    
    // Criar algumas funções de teste
    const coordenador = await prisma.role.create({
      data: {
        name: 'coordenador',
        description: 'Coordenador de atividades aquáticas'
      }
    });
    
    const auxiliar = await prisma.role.create({
      data: {
        name: 'auxiliar',
        description: 'Auxiliar de ensino'
      }
    });
    
    console.log('✅ Funções criadas:', { coordenador, auxiliar });
    
    // Listar todas as funções
    const allRoles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    console.log('📋 Todas as funções:', allRoles);
    
    // Testar atualização
    const updatedRole = await prisma.role.update({
      where: { id: coordenador.id },
      data: { description: 'Coordenador geral de natação' }
    });
    
    console.log('🔄 Função atualizada:', updatedRole);
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoles();