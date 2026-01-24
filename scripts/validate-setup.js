#!/usr/bin/env node

/**
 * SwimFlow Setup Validation Script
 * Validates that the project infrastructure is properly configured
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green')
    return true
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, 'red')
    return false
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    log(`✅ ${description}`, 'green')
    return true
  } else {
    log(`❌ ${description} - Directory not found: ${dirPath}`, 'red')
    return false
  }
}

function runCommand(command, description, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'pipe' })
    log(`✅ ${description}`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} - Command failed: ${command}`, 'red')
    return false
  }
}

function main() {
  log('🏊 SwimFlow Setup Validation', 'cyan')
  log('============================', 'cyan')
  
  let allChecksPass = true
  
  // Check project structure
  log('\n📁 Project Structure:', 'blue')
  allChecksPass &= checkFile('package.json', 'Root package.json')
  allChecksPass &= checkFile('README.md', 'README.md')
  allChecksPass &= checkFile('.gitignore', '.gitignore')
  allChecksPass &= checkFile('.prettierrc', 'Prettier config')
  
  // Check frontend structure
  log('\n🎨 Frontend Structure:', 'blue')
  allChecksPass &= checkDirectory('frontend', 'Frontend directory')
  allChecksPass &= checkFile('frontend/package.json', 'Frontend package.json')
  allChecksPass &= checkFile('frontend/tsconfig.json', 'Frontend TypeScript config')
  allChecksPass &= checkFile('frontend/vite.config.ts', 'Vite config')
  allChecksPass &= checkFile('frontend/tailwind.config.js', 'Tailwind config')
  allChecksPass &= checkFile('frontend/src/main.tsx', 'Frontend entry point')
  allChecksPass &= checkFile('frontend/src/App.tsx', 'React App component')
  allChecksPass &= checkFile('frontend/src/index.css', 'Main CSS file')
  
  // Check backend structure
  log('\n🔧 Backend Structure:', 'blue')
  allChecksPass &= checkDirectory('backend', 'Backend directory')
  allChecksPass &= checkFile('backend/package.json', 'Backend package.json')
  allChecksPass &= checkFile('backend/tsconfig.json', 'Backend TypeScript config')
  allChecksPass &= checkFile('backend/src/index.ts', 'Backend entry point')
  allChecksPass &= checkFile('backend/src/config/database.ts', 'Database config')
  
  // Check Prisma setup
  log('\n🗄️  Database Setup:', 'blue')
  allChecksPass &= checkFile('backend/prisma/schema.prisma', 'Prisma schema')
  allChecksPass &= checkFile('backend/prisma/seed.ts', 'Database seed file')
  allChecksPass &= checkDirectory('backend/prisma/migrations', 'Migrations directory')
  allChecksPass &= checkFile('backend/.env.example', 'Environment example file')
  
  // Check configuration files
  log('\n⚙️  Configuration Files:', 'blue')
  allChecksPass &= checkFile('frontend/.eslintrc.cjs', 'Frontend ESLint config')
  allChecksPass &= checkFile('backend/.eslintrc.js', 'Backend ESLint config')
  allChecksPass &= checkFile('backend/jest.config.js', 'Jest config')
  
  // Check scripts
  log('\n📜 Scripts:', 'blue')
  allChecksPass &= checkFile('scripts/setup-database.sh', 'Database setup script')
  
  // Check if Node.js and npm are available
  log('\n🔍 Dependencies:', 'blue')
  allChecksPass &= runCommand('node --version', 'Node.js is installed')
  allChecksPass &= runCommand('npm --version', 'npm is installed')
  
  // Summary
  log('\n📊 Validation Summary:', 'magenta')
  if (allChecksPass) {
    log('🎉 All checks passed! Your SwimFlow project is properly set up.', 'green')
    log('\n📝 Next steps:', 'yellow')
    log('1. Install dependencies: npm install && cd backend && npm install && cd ../frontend && npm install')
    log('2. Set up database: ./scripts/setup-database.sh')
    log('3. Configure environment: cp backend/.env.example backend/.env')
    log('4. Run migrations: npm run db:migrate')
    log('5. Seed database: npm run db:seed')
    log('6. Start development: npm run dev')
  } else {
    log('❌ Some checks failed. Please review the errors above.', 'red')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}