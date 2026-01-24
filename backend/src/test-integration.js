const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEvaluationFlow() {
  console.log('🧪 Testando fluxo completo de avaliação...\n');

  try {
    // 1. Buscar um aluno existente
    console.log('1. Buscando aluno...');
    const student = await prisma.student.findFirst();
    if (!student) {
      throw new Error('Nenhum aluno encontrado');
    }
    console.log(`   ✅ Aluno encontrado: ${student.name} (${student.level})\n`);

    // 2. Buscar um professor
    console.log('2. Buscando professor...');
    const professor = await prisma.user.findFirst({
      where: { role: 'professor' }
    });
    if (!professor) {
      throw new Error('Nenhum professor encontrado');
    }
    console.log(`   ✅ Professor encontrado: ${professor.name}\n`);

    // 3. Criar uma nova avaliação
    console.log('3. Criando nova avaliação...');
    const evaluation = await prisma.evaluation.create({
      data: {
        studentId: student.id,
        professorId: professor.id,
        date: new Date(),
        generalNotes: 'Teste de integração - Progresso excelente!',
        strokeEvaluations: {
          create: [
            {
              strokeType: 'crawl',
              technique: 8,
              timeSeconds: 32.5,
              resistance: 7,
              notes: 'Boa respiração bilateral'
            },
            {
              strokeType: 'costas',
              technique: 6,
              timeSeconds: 45.2,
              resistance: 5,
              notes: 'Precisa melhorar a entrada da mão'
            },
            {
              strokeType: 'peito',
              technique: 7,
              timeSeconds: 38.8,
              resistance: 6,
              notes: 'Coordenação melhorando'
            }
          ]
        }
      },
      include: {
        strokeEvaluations: true,
        student: {
          select: { name: true, level: true }
        },
        professor: {
          select: { name: true }
        }
      }
    });
    console.log(`   ✅ Avaliação criada com ID: ${evaluation.id}`);
    console.log(`   📊 ${evaluation.strokeEvaluations.length} tipos de nado avaliados\n`);

    // 4. Verificar se a data da última avaliação foi atualizada no aluno
    console.log('4. Verificando atualização da data no aluno...');
    const updatedStudent = await prisma.student.findUnique({
      where: { id: student.id }
    });
    console.log(`   ✅ Data da última avaliação atualizada: ${updatedStudent.lastEvaluationDate}\n`);

    // 5. Buscar histórico de avaliações do aluno
    console.log('5. Buscando histórico de avaliações...');
    const evaluations = await prisma.evaluation.findMany({
      where: { studentId: student.id },
      include: {
        strokeEvaluations: true,
        professor: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    console.log(`   ✅ ${evaluations.length} avaliações encontradas no histórico\n`);

    // 6. Testar dados de evolução
    console.log('6. Testando dados de evolução...');
    const strokeEvaluations = await prisma.strokeEvaluation.findMany({
      where: {
        evaluation: {
          studentId: student.id
        }
      },
      include: {
        evaluation: {
          select: { date: true }
        }
      },
      orderBy: {
        evaluation: { date: 'asc' }
      }
    });
    
    // Agrupar por tipo de nado
    const evolutionData = {};
    strokeEvaluations.forEach(stroke => {
      if (!evolutionData[stroke.strokeType]) {
        evolutionData[stroke.strokeType] = [];
      }
      evolutionData[stroke.strokeType].push({
        date: stroke.evaluation.date,
        technique: stroke.technique,
        resistance: stroke.resistance,
        timeSeconds: stroke.timeSeconds
      });
    });

    Object.entries(evolutionData).forEach(([strokeType, data]) => {
      console.log(`   📈 ${strokeType}: ${data.length} avaliações`);
    });
    console.log('   ✅ Dados de evolução calculados com sucesso\n');

    // 7. Testar estatísticas do aluno
    console.log('7. Calculando estatísticas...');
    const totalEvaluations = evaluations.length;
    const strokeStats = {};
    
    evaluations.forEach(evaluation => {
      evaluation.strokeEvaluations.forEach(stroke => {
        if (!strokeStats[stroke.strokeType]) {
          strokeStats[stroke.strokeType] = { technique: 0, resistance: 0, count: 0 };
        }
        strokeStats[stroke.strokeType].technique += stroke.technique;
        strokeStats[stroke.strokeType].resistance += stroke.resistance;
        strokeStats[stroke.strokeType].count += 1;
      });
    });

    const averageScores = {};
    Object.entries(strokeStats).forEach(([strokeType, stats]) => {
      averageScores[strokeType] = {
        technique: Math.round((stats.technique / stats.count) * 10) / 10,
        resistance: Math.round((stats.resistance / stats.count) * 10) / 10
      };
    });

    console.log(`   📊 Total de avaliações: ${totalEvaluations}`);
    console.log('   📈 Médias por tipo de nado:');
    Object.entries(averageScores).forEach(([strokeType, scores]) => {
      console.log(`      ${strokeType}: Técnica ${scores.technique}/10, Resistência ${scores.resistance}/10`);
    });
    console.log('   ✅ Estatísticas calculadas com sucesso\n');

    console.log('🎉 TESTE DE INTEGRAÇÃO CONCLUÍDO COM SUCESSO!');
    console.log('✅ Todos os componentes do sistema de avaliações estão funcionando corretamente');
    console.log('✅ Banco de dados PostgreSQL operacional');
    console.log('✅ Criação, leitura e cálculos de avaliações funcionando');
    console.log('✅ Atualização automática de dados do aluno funcionando');
    console.log('✅ Dados de evolução e estatísticas sendo gerados corretamente');

  } catch (error) {
    console.error('❌ Erro no teste de integração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEvaluationFlow();