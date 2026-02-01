// SwimFlow Package Scripts
// Este arquivo define scripts npm mais avançados usando nps (npm-package-scripts)

const { series, concurrent, rimraf } = require('nps-utils');

module.exports = {
  scripts: {
    // Scripts de desenvolvimento
    dev: {
      description: 'Inicia ambiente de desenvolvimento',
      default: concurrent.nps('dev.backend', 'dev.frontend'),
      backend: {
        description: 'Inicia apenas o backend',
        script: 'cd backend && npm run dev'
      },
      frontend: {
        description: 'Inicia apenas o frontend',
        script: 'cd frontend && npm run dev'
      },
      apps: {
        description: 'Inicia apenas frontend e backend (sem Docker)',
        script: './scripts/apps-only.sh start'
      },
      full: {
        description: 'Inicia ambiente completo com banco',
        script: series(
          'docker-compose -f docker-compose.dev.yml up -d',
          'sleep 5',
          concurrent.nps('dev.backend', 'dev.frontend')
        )
      }
    },

    // Scripts de build
    build: {
      description: 'Faz build do projeto',
      default: series.nps('build.backend', 'build.frontend'),
      backend: {
        description: 'Build do backend',
        script: 'cd backend && npm run build'
      },
      frontend: {
        description: 'Build do frontend',
        script: 'cd frontend && npm run build'
      },
      clean: {
        description: 'Limpa builds anteriores',
        script: series(
          rimraf('backend/dist'),
          rimraf('frontend/dist')
        )
      }
    },

    // Scripts de teste
    test: {
      description: 'Executa todos os testes',
      default: series.nps('test.lint', 'test.unit', 'test.integration'),
      unit: {
        description: 'Testes unitários',
        script: concurrent.nps('test.unit.backend', 'test.unit.frontend')
      },
      'unit.backend': {
        description: 'Testes unitários do backend',
        script: 'cd backend && npm run test'
      },
      'unit.frontend': {
        description: 'Testes unitários do frontend',
        script: 'cd frontend && npm run test'
      },
      integration: {
        description: 'Testes de integração',
        script: series(
          'docker-compose -f docker-compose.test.yml up -d',
          'sleep 10',
          'cd backend && NODE_ENV=test npm run test -- --testPathPattern=integration',
          'docker-compose -f docker-compose.test.yml down'
        )
      },
      e2e: {
        description: 'Testes E2E',
        script: series(
          nps('dev.full'),
          'sleep 15',
          'cd frontend && npm run test:e2e',
          'pkill -f "node.*dist/index.js" || true',
          'pkill -f "vite" || true'
        )
      },
      coverage: {
        description: 'Testes com cobertura',
        script: concurrent({
          backend: 'cd backend && npm run test -- --coverage',
          frontend: 'cd frontend && npm run test -- --coverage'
        })
      },
      watch: {
        description: 'Testes em modo watch',
        backend: 'cd backend && npm run test:watch',
        frontend: 'cd frontend && npm run test:watch'
      },
      lint: {
        description: 'Lint de código',
        script: concurrent.nps('test.lint.backend', 'test.lint.frontend')
      },
      'lint.backend': {
        description: 'Lint do backend',
        script: 'cd backend && npm run lint'
      },
      'lint.frontend': {
        description: 'Lint do frontend',
        script: 'cd frontend && npm run lint'
      }
    },

    // Scripts de banco de dados
    db: {
      description: 'Operações de banco de dados',
      migrate: {
        description: 'Executa migrations',
        script: 'cd backend && npx prisma migrate dev'
      },
      seed: {
        description: 'Popula banco com dados',
        script: 'cd backend && npx prisma db seed'
      },
      reset: {
        description: 'Reseta banco de dados',
        script: 'cd backend && npx prisma migrate reset --force'
      },
      studio: {
        description: 'Abre Prisma Studio',
        script: 'cd backend && npx prisma studio'
      },
      backup: {
        description: 'Faz backup do banco',
        script: './scripts/db-manager.sh backup'
      },
      restore: {
        description: 'Restaura backup do banco',
        script: './scripts/db-manager.sh restore'
      }
    },

    // Scripts de deploy
    deploy: {
      description: 'Deploy da aplicação',
      production: {
        description: 'Deploy para produção',
        script: series(
          nps('test'),
          nps('build'),
          './scripts/deploy.sh deploy production'
        )
      },
      staging: {
        description: 'Deploy para staging',
        script: series(
          nps('test.unit'),
          nps('build'),
          './scripts/deploy.sh deploy staging'
        )
      },
      rollback: {
        description: 'Rollback do deploy',
        script: './scripts/deploy.sh rollback'
      }
    },

    // Scripts de qualidade
    quality: {
      description: 'Verificações de qualidade',
      default: series.nps('quality.lint', 'quality.format', 'quality.types'),
      lint: {
        description: 'Lint com correção automática',
        script: concurrent({
          backend: 'cd backend && npm run lint:fix',
          frontend: 'cd frontend && npm run lint:fix'
        })
      },
      format: {
        description: 'Formatação de código',
        script: 'npm run format'
      },
      types: {
        description: 'Verificação de tipos',
        script: concurrent({
          backend: 'cd backend && npx tsc --noEmit',
          frontend: 'cd frontend && npm run type-check'
        })
      }
    },

    // Scripts de Docker
    docker: {
      description: 'Operações Docker',
      up: {
        description: 'Inicia containers',
        script: 'docker-compose -f docker-compose.dev.yml up -d'
      },
      down: {
        description: 'Para containers',
        script: 'docker-compose -f docker-compose.dev.yml down'
      },
      logs: {
        description: 'Mostra logs dos containers',
        script: 'docker-compose -f docker-compose.dev.yml logs -f'
      },
      clean: {
        description: 'Limpa containers e volumes',
        script: 'docker-compose -f docker-compose.dev.yml down -v --rmi all'
      },
      rebuild: {
        description: 'Reconstrói containers',
        script: 'docker-compose -f docker-compose.dev.yml build --no-cache'
      }
    },

    // Scripts de manutenção
    maintenance: {
      description: 'Scripts de manutenção',
      clean: {
        description: 'Limpeza completa',
        script: series(
          rimraf('node_modules'),
          rimraf('backend/node_modules'),
          rimraf('frontend/node_modules'),
          rimraf('backend/dist'),
          rimraf('frontend/dist'),
          rimraf('coverage'),
          rimraf('test-reports')
        )
      },
      install: {
        description: 'Instalação completa',
        script: series(
          'npm install',
          'cd backend && npm install',
          'cd frontend && npm install'
        )
      },
      update: {
        description: 'Atualiza dependências',
        script: series(
          'npm update',
          'cd backend && npm update',
          'cd frontend && npm update'
        )
      },
      audit: {
        description: 'Auditoria de segurança',
        script: concurrent({
          root: 'npm audit',
          backend: 'cd backend && npm audit',
          frontend: 'cd frontend && npm audit'
        })
      },
      'audit.fix': {
        description: 'Corrige vulnerabilidades',
        script: concurrent({
          root: 'npm audit fix',
          backend: 'cd backend && npm audit fix',
          frontend: 'cd frontend && npm audit fix'
        })
      }
    },

    // Scripts de monitoramento
    monitor: {
      description: 'Scripts de monitoramento',
      health: {
        description: 'Verifica saúde da aplicação',
        script: './scripts/deploy.sh health'
      },
      logs: {
        description: 'Mostra logs da aplicação',
        script: 'tail -f backend/logs/*.log'
      },
      performance: {
        description: 'Testes de performance',
        script: './scripts/test-runner.sh performance'
      }
    },

    // Scripts de utilitários
    utils: {
      description: 'Scripts utilitários',
      'apps-only': {
        description: 'Inicia apenas aplicações (frontend + backend)',
        script: './scripts/apps-only.sh start'
      },
      'apps-stop': {
        description: 'Para apenas as aplicações',
        script: './scripts/apps-only.sh stop'
      },
      'apps-status': {
        description: 'Status das aplicações',
        script: './scripts/apps-only.sh status'
      },
      validate: {
        description: 'Valida configuração',
        script: 'node scripts/validate-setup.js'
      },
      version: {
        description: 'Mostra informações de versão',
        script: series(
          'echo "SwimFlow Management System"',
          'echo "Versão: $(node -p "require(\'./package.json\').version")"',
          'echo "Node.js: $(node --version)"',
          'echo "npm: $(npm --version)"'
        )
      },
      ports: {
        description: 'Mostra portas em uso',
        script: 'lsof -i :3000 -i :3001 -i :5432 -i :5555'
      }
    }
  }
};

// Função helper para nps
function nps(script) {
  return `nps ${script}`;
}