import { PrismaClient, Level, StrokeType } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Safety: this seed wipes tables. Require explicit opt-in.
  if (process.env.SEED_WIPE !== '1') {
    console.error('❌ Seed abortado para evitar perda de dados.')
    console.error('Defina SEED_WIPE=1 para permitir limpar tabelas e repopular dados de dev.')
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL nao definido; seed abortado.')
    process.exit(1)
  }

  let dbName = ''
  try {
    const url = new URL(databaseUrl)
    dbName = (url.pathname || '').replace(/^\//, '')
  } catch {
    console.error('❌ DATABASE_URL invalido; seed abortado.')
    process.exit(1)
  }

  // Require confirmation bound to the target DB name.
  const expectedConfirm = `WIPE_${dbName}`
  if (process.env.SEED_CONFIRM !== expectedConfirm) {
    console.error('❌ Seed abortado: confirmacao faltando ou invalida.')
    console.error(`Defina SEED_CONFIRM=${expectedConfirm} para continuar.`)
    process.exit(1)
  }

  // Extra safety: only allow wiping the default dev DB unless explicitly overridden.
  if (dbName !== 'swimflow_dev' && process.env.SEED_ALLOW_NON_DEV !== '1') {
    console.error(`❌ Seed abortado: DB alvo (${dbName}) nao parece ser dev.`)
    console.error('Use SEED_ALLOW_NON_DEV=1 apenas se voce tem certeza absoluta.')
    process.exit(1)
  }

  // Limpar dados existentes (em ordem devido às foreign keys)
  await prisma.strokeEvaluation.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.trainingParticipant.deleteMany()
  await prisma.training.deleteMany()
  await prisma.classStudent.deleteMany()
  await prisma.classSchedule.deleteMany()
  await prisma.class.deleteMany()
  await prisma.pool.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Dados existentes removidos')

  // Criar usuários (professores e administradores)
  const adminPassword = await bcrypt.hash('admin123', 10)
  const professorPassword = await bcrypt.hash('prof123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@swimflow.com',
      passwordHash: adminPassword,
      name: 'Administrador SwimFlow',
      role: 'admin',
      profileImage: null,
      authProvider: 'local',
      emailVerified: true,
    },
  })

  const professor1 = await prisma.user.create({
    data: {
      email: 'carlos.silva@swimflow.com',
      passwordHash: professorPassword,
      name: 'Carlos Silva',
      role: 'professor',
      profileImage: null,
      authProvider: 'local',
      emailVerified: true,
    },
  })

  const professor2 = await prisma.user.create({
    data: {
      email: 'ana.santos@swimflow.com',
      passwordHash: professorPassword,
      name: 'Ana Santos',
      role: 'professor',
      profileImage: null,
      authProvider: 'local',
      emailVerified: true,
    },
  })

  console.log('👥 Usuários criados')

  // Criar piscinas
  const pool1 = await prisma.pool.create({
    data: {
      name: 'Piscina Olímpica Principal',
      capacity: 50,
      length: 50.0,
      lanes: 8,
      temperature: 26.5,
      description: 'Piscina olímpica de 50m com 8 raias, ideal para treinos avançados e competições.',
    },
  })

  const pool2 = await prisma.pool.create({
    data: {
      name: 'Piscina Semi-Olímpica',
      capacity: 30,
      length: 25.0,
      lanes: 6,
      temperature: 27.0,
      description: 'Piscina de 25m com 6 raias, perfeita para aulas e treinos intermediários.',
    },
  })

  const pool3 = await prisma.pool.create({
    data: {
      name: 'Piscina Infantil',
      capacity: 20,
      length: 15.0,
      lanes: 4,
      temperature: 28.0,
      description: 'Piscina aquecida para crianças e iniciantes, com profundidade reduzida.',
    },
  })

  console.log('🏊 Piscinas criadas')

  // Criar turmas
  const class1 = await prisma.class.create({
    data: {
      name: 'Natação Avançada - Manhã',
      poolId: pool1.id,
      maxCapacity: 12,
    },
  })

  const class2 = await prisma.class.create({
    data: {
      name: 'Natação Intermediária - Tarde',
      poolId: pool2.id,
      maxCapacity: 15,
    },
  })

  const class3 = await prisma.class.create({
    data: {
      name: 'Natação Infantil - Manhã',
      poolId: pool3.id,
      maxCapacity: 10,
    },
  })

  console.log('🏫 Turmas criadas')

  // Criar horários das turmas
  await prisma.classSchedule.createMany({
    data: [
      // Natação Avançada - Segunda, Quarta, Sexta 07:00-08:00
      {
        classId: class1.id,
        professorId: professor1.id,
        dayOfWeek: 1, // Segunda
        startTime: new Date('1970-01-01T07:00:00Z'),
        endTime: new Date('1970-01-01T08:00:00Z'),
      },
      {
        classId: class1.id,
        professorId: professor1.id,
        dayOfWeek: 3, // Quarta
        startTime: new Date('1970-01-01T07:00:00Z'),
        endTime: new Date('1970-01-01T08:00:00Z'),
      },
      {
        classId: class1.id,
        professorId: professor1.id,
        dayOfWeek: 5, // Sexta
        startTime: new Date('1970-01-01T07:00:00Z'),
        endTime: new Date('1970-01-01T08:00:00Z'),
      },
      // Natação Intermediária - Terça, Quinta 15:00-16:00
      {
        classId: class2.id,
        professorId: professor2.id,
        dayOfWeek: 2, // Terça
        startTime: new Date('1970-01-01T15:00:00Z'),
        endTime: new Date('1970-01-01T16:00:00Z'),
      },
      {
        classId: class2.id,
        professorId: professor2.id,
        dayOfWeek: 4, // Quinta
        startTime: new Date('1970-01-01T15:00:00Z'),
        endTime: new Date('1970-01-01T16:00:00Z'),
      },
      // Natação Infantil - Segunda a Sexta 09:00-10:00
      {
        classId: class3.id,
        professorId: professor2.id,
        dayOfWeek: 1, // Segunda
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T10:00:00Z'),
      },
      {
        classId: class3.id,
        professorId: professor2.id,
        dayOfWeek: 2, // Terça
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T10:00:00Z'),
      },
      {
        classId: class3.id,
        professorId: professor2.id,
        dayOfWeek: 3, // Quarta
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T10:00:00Z'),
      },
      {
        classId: class3.id,
        professorId: professor2.id,
        dayOfWeek: 4, // Quinta
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T10:00:00Z'),
      },
      {
        classId: class3.id,
        professorId: professor2.id,
        dayOfWeek: 5, // Sexta
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T10:00:00Z'),
      },
    ],
  })

  console.log('📅 Horários das turmas criados')

  // Criar alunos
  const students = await prisma.student.createMany({
    data: [
      // Alunos avançados
      {
        name: 'João Pedro Silva',
        email: 'joao.pedro@email.com',
        phone: '(11) 99999-1111',
        birthDate: new Date('1995-03-15'),
        level: Level.avancado,
        objectives: 'Melhorar tempo nos 100m livre e participar de competições regionais.',
        medicalNotes: 'Nenhuma restrição médica.',
      },
      {
        name: 'Maria Fernanda Costa',
        email: 'maria.fernanda@email.com',
        phone: '(11) 99999-2222',
        birthDate: new Date('1992-07-22'),
        level: Level.avancado,
        objectives: 'Aperfeiçoar técnica do nado borboleta e aumentar resistência.',
        medicalNotes: 'Histórico de lesão no ombro direito - evitar sobrecarga.',
      },
      {
        name: 'Rafael Oliveira',
        email: 'rafael.oliveira@email.com',
        phone: '(11) 99999-3333',
        birthDate: new Date('1988-11-08'),
        level: Level.avancado,
        objectives: 'Preparação para triathlon e melhoria da técnica de respiração.',
        medicalNotes: 'Nenhuma restrição médica.',
      },
      // Alunos intermediários
      {
        name: 'Carla Mendes',
        email: 'carla.mendes@email.com',
        phone: '(11) 99999-4444',
        birthDate: new Date('1998-05-12'),
        level: Level.intermediario,
        objectives: 'Dominar os quatro estilos de nado e melhorar condicionamento físico.',
        medicalNotes: 'Asma leve - sempre ter broncodilatador por perto.',
      },
      {
        name: 'Bruno Santos',
        email: 'bruno.santos@email.com',
        phone: '(11) 99999-5555',
        birthDate: new Date('1990-09-30'),
        level: Level.intermediario,
        objectives: 'Aprender nado borboleta e melhorar técnica do nado de costas.',
        medicalNotes: 'Nenhuma restrição médica.',
      },
      {
        name: 'Juliana Rodrigues',
        email: 'juliana.rodrigues@email.com',
        phone: '(11) 99999-6666',
        birthDate: new Date('1996-01-18'),
        level: Level.intermediario,
        objectives: 'Aumentar distância nadada sem parar e melhorar velocidade.',
        medicalNotes: 'Nenhuma restrição médica.',
      },
      // Alunos iniciantes (crianças)
      {
        name: 'Pedro Henrique Lima',
        email: 'pedro.lima@email.com',
        phone: '(11) 99999-7777',
        birthDate: new Date('2015-04-10'),
        level: Level.iniciante,
        objectives: 'Aprender a nadar com segurança e superar o medo da água.',
        medicalNotes: 'Criança muito ativa - precisa de atenção constante.',
      },
      {
        name: 'Sofia Almeida',
        email: 'sofia.almeida@email.com',
        phone: '(11) 99999-8888',
        birthDate: new Date('2016-08-25'),
        level: Level.iniciante,
        objectives: 'Desenvolver coordenação motora e aprender nado crawl básico.',
        medicalNotes: 'Nenhuma restrição médica.',
      },
      {
        name: 'Lucas Gabriel',
        email: 'lucas.gabriel@email.com',
        phone: '(11) 99999-9999',
        birthDate: new Date('2014-12-03'),
        level: Level.iniciante,
        objectives: 'Ganhar confiança na água e aprender flutuação.',
        medicalNotes: 'Alergia a cloro - usar óculos de proteção sempre.',
      },
    ],
  })

  console.log('🏊‍♂️ Alunos criados')

  // Buscar IDs dos alunos criados para associações
  const allStudents = await prisma.student.findMany({
    orderBy: { createdAt: 'asc' },
  })

  // Associar alunos às turmas
  await prisma.classStudent.createMany({
    data: [
      // Turma Avançada
      { classId: class1.id, studentId: allStudents[0].id }, // João Pedro
      { classId: class1.id, studentId: allStudents[1].id }, // Maria Fernanda
      { classId: class1.id, studentId: allStudents[2].id }, // Rafael
      // Turma Intermediária
      { classId: class2.id, studentId: allStudents[3].id }, // Carla
      { classId: class2.id, studentId: allStudents[4].id }, // Bruno
      { classId: class2.id, studentId: allStudents[5].id }, // Juliana
      // Turma Infantil
      { classId: class3.id, studentId: allStudents[6].id }, // Pedro Henrique
      { classId: class3.id, studentId: allStudents[7].id }, // Sofia
      { classId: class3.id, studentId: allStudents[8].id }, // Lucas
    ],
  })

  console.log('📚 Alunos associados às turmas')

  // Criar alguns treinos de exemplo
  const training1 = await prisma.training.create({
    data: {
      classId: class1.id,
      date: new Date('2024-01-15'),
      duration: 60,
      activities: [
        'Aquecimento: 400m livre',
        'Série principal: 8x100m livre com 20s descanso',
        'Técnica: 200m borboleta com pull buoy',
        'Desaquecimento: 200m costas suave',
      ],
      notes: 'Foco na técnica de respiração bilateral no crawl.',
    },
  })

  const training2 = await prisma.training.create({
    data: {
      classId: class2.id,
      date: new Date('2024-01-16'),
      duration: 45,
      activities: [
        'Aquecimento: 200m livre',
        'Exercícios de pernada: 4x50m com prancha',
        'Série principal: 6x75m misto (25 costas + 50 livre)',
        'Desaquecimento: 100m peito suave',
      ],
      notes: 'Trabalho de coordenação entre braçada e respiração.',
    },
  })

  const training3 = await prisma.training.create({
    data: {
      classId: class3.id,
      date: new Date('2024-01-17'),
      duration: 30,
      activities: [
        'Brincadeiras de adaptação aquática',
        'Exercícios de flutuação com apoio',
        'Primeiros movimentos de pernada',
        'Respiração na água com apoio',
      ],
      notes: 'Foco na confiança e adaptação ao meio aquático.',
    },
  })

  console.log('🏊 Treinos criados')

  // Associar participantes aos treinos
  await prisma.trainingParticipant.createMany({
    data: [
      // Training 1 - Turma Avançada
      { trainingId: training1.id, studentId: allStudents[0].id },
      { trainingId: training1.id, studentId: allStudents[1].id },
      { trainingId: training1.id, studentId: allStudents[2].id },
      // Training 2 - Turma Intermediária
      { trainingId: training2.id, studentId: allStudents[3].id },
      { trainingId: training2.id, studentId: allStudents[4].id },
      { trainingId: training2.id, studentId: allStudents[5].id },
      // Training 3 - Turma Infantil
      { trainingId: training3.id, studentId: allStudents[6].id },
      { trainingId: training3.id, studentId: allStudents[7].id },
      { trainingId: training3.id, studentId: allStudents[8].id },
    ],
  })

  console.log('👥 Participantes associados aos treinos')

  // Criar avaliações de exemplo
  const evaluation1 = await prisma.evaluation.create({
    data: {
      studentId: allStudents[0].id, // João Pedro
      professorId: professor1.id,
      date: new Date('2024-01-10'),
      generalNotes: 'Excelente evolução técnica. Pronto para competições regionais.',
    },
  })

  const evaluation2 = await prisma.evaluation.create({
    data: {
      studentId: allStudents[3].id, // Carla
      professorId: professor2.id,
      date: new Date('2024-01-12'),
      generalNotes: 'Boa progressão. Precisa trabalhar mais a coordenação no nado borboleta.',
    },
  })

  // Criar avaliações por tipo de nado
  await prisma.strokeEvaluation.createMany({
    data: [
      // Avaliação João Pedro (avançado)
      {
        evaluationId: evaluation1.id,
        strokeType: StrokeType.crawl,
        technique: 9,
        timeSeconds: 58.5,
        resistance: 8,
        notes: 'Técnica excelente, respiração bilateral bem executada.',
      },
      {
        evaluationId: evaluation1.id,
        strokeType: StrokeType.costas,
        technique: 8,
        timeSeconds: 65.2,
        resistance: 7,
        notes: 'Boa técnica, pode melhorar a rotação do corpo.',
      },
      {
        evaluationId: evaluation1.id,
        strokeType: StrokeType.peito,
        technique: 7,
        timeSeconds: 72.8,
        resistance: 6,
        notes: 'Precisa trabalhar a sincronização braçada-pernada.',
      },
      {
        evaluationId: evaluation1.id,
        strokeType: StrokeType.borboleta,
        technique: 8,
        timeSeconds: 68.9,
        resistance: 7,
        notes: 'Boa ondulação, pode melhorar a entrada das mãos.',
      },
      // Avaliação Carla (intermediário)
      {
        evaluationId: evaluation2.id,
        strokeType: StrokeType.crawl,
        technique: 7,
        timeSeconds: 75.3,
        resistance: 6,
        notes: 'Técnica sólida, precisa trabalhar velocidade.',
      },
      {
        evaluationId: evaluation2.id,
        strokeType: StrokeType.costas,
        technique: 6,
        timeSeconds: 82.1,
        resistance: 5,
        notes: 'Posição do corpo precisa de ajustes.',
      },
      {
        evaluationId: evaluation2.id,
        strokeType: StrokeType.peito,
        technique: 6,
        timeSeconds: 88.7,
        resistance: 5,
        notes: 'Movimento básico correto, falta refinamento.',
      },
      {
        evaluationId: evaluation2.id,
        strokeType: StrokeType.borboleta,
        technique: 4,
        timeSeconds: null, // Ainda não consegue completar a distância
        resistance: 3,
        notes: 'Iniciando aprendizado, foco na ondulação básica.',
      },
    ],
  })

  // Atualizar data da última avaliação dos alunos
  await prisma.student.update({
    where: { id: allStudents[0].id },
    data: { lastEvaluationDate: new Date('2024-01-10') },
  })

  await prisma.student.update({
    where: { id: allStudents[3].id },
    data: { lastEvaluationDate: new Date('2024-01-12') },
  })

  console.log('📊 Avaliações criadas')

  console.log('✅ Seed concluído com sucesso!')
  console.log('\n📋 Dados criados:')
  console.log('   👤 3 usuários (1 admin, 2 professores)')
  console.log('   🏊 9 alunos (3 por nível)')
  console.log('   🏊‍♀️ 3 piscinas')
  console.log('   📚 3 turmas com horários')
  console.log('   🏃‍♂️ 3 treinos com participantes')
  console.log('   📊 2 avaliações completas')
  console.log('\n🔑 Credenciais de acesso:')
  console.log('   Admin: admin@swimflow.com / admin123')
  console.log('   Prof1: carlos.silva@swimflow.com / prof123')
  console.log('   Prof2: ana.santos@swimflow.com / prof123')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
