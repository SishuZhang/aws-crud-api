#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSetup {
  constructor() {
    this.checks = {
      node: false,
      npm: false,
      playwright: false,
      dependencies: false
    };
  }

  log(message, type = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      step: '🔧'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  async checkNode() {
    this.log('Checking Node.js installation...');
    
    try {
      const version = execSync('node --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
      
      if (majorVersion >= 20) {
        this.log(`Node.js ${version} found`, 'success');
        this.checks.node = true;
        return true;
      } else {
        this.log(`Node.js ${version} found, but version 20+ is required`, 'error');
        return false;
      }
    } catch (error) {
      this.log('Node.js not found. Please install Node.js 20 or higher', 'error');
      return false;
    }
  }

  async checkNpm() {
    this.log('Checking npm installation...');
    
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`npm ${version} found`, 'success');
      this.checks.npm = true;
      return true;
    } catch (error) {
      this.log('npm not found', 'error');
      return false;
    }
  }

  async installDependencies() {
    this.log('Installing project dependencies...', 'step');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      this.log('Dependencies installed successfully', 'success');
      this.checks.dependencies = true;
      return true;
    } catch (error) {
      this.log('Failed to install dependencies', 'error');
      return false;
    }
  }

  async installPlaywright() {
    this.log('Installing Playwright browsers...', 'step');
    
    try {
      execSync('npx playwright install', { stdio: 'inherit' });
      this.log('Playwright browsers installed successfully', 'success');
      this.checks.playwright = true;
      return true;
    } catch (error) {
      this.log('Failed to install Playwright browsers', 'error');
      return false;
    }
  }

  async createDirectories() {
    this.log('Creating necessary directories...', 'step');
    
    const dirs = [
      'public',
      'tests',
      'scripts',
      'playwright-report',
      'test-results'
    ];

    for (const dir of dirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.log(`Created directory: ${dir}`, 'success');
      } else {
        this.log(`Directory already exists: ${dir}`, 'info');
      }
    }
  }

  async verifySetup() {
    this.log('Verifying test setup...', 'step');
    
    const files = [
      'playwright.config.js',
      'tests/api.test.js',
      'tests/ui.test.js',
      'tests/test-utils.js',
      'public/index.html',
      'scripts/run-tests.js'
    ];

    let allFilesExist = true;
    
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.log(`✓ ${file}`, 'success');
      } else {
        this.log(`✗ ${file} (missing)`, 'error');
        allFilesExist = false;
      }
    }

    return allFilesExist;
  }

  async run() {
    console.log('🚀 Setting up AWS CRUD API Test Environment\n');
    
    const steps = [
      { name: 'Node.js Check', fn: () => this.checkNode() },
      { name: 'npm Check', fn: () => this.checkNpm() },
      { name: 'Create Directories', fn: () => this.createDirectories() },
      { name: 'Install Dependencies', fn: () => this.installDependencies() },
      { name: 'Install Playwright', fn: () => this.installPlaywright() },
      { name: 'Verify Setup', fn: () => this.verifySetup() }
    ];

    let allPassed = true;

    for (const step of steps) {
      this.log(`\n📋 ${step.name}`, 'step');
      const result = await step.fn();
      if (!result) {
        allPassed = false;
      }
    }

    console.log('\n' + '='.repeat(60));
    
    if (allPassed) {
      this.log('🎉 Test setup completed successfully!', 'success');
      console.log('\n📚 Next Steps:');
      console.log('   1. Start the API server: npm run offline');
      console.log('   2. Start the UI server: npx http-server public -p 3000 -o');
      console.log('   3. Run tests: node scripts/run-tests.js');
      console.log('\n📖 For more information, see TESTING.md');
    } else {
      this.log('❌ Test setup failed. Please check the errors above.', 'error');
      console.log('\n🔧 Troubleshooting:');
      console.log('   - Ensure Node.js 20+ is installed');
      console.log('   - Check your internet connection');
      console.log('   - Verify file permissions');
      console.log('   - See TESTING.md for detailed instructions');
    }
    
    console.log('='.repeat(60));
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Run the setup
if (require.main === module) {
  const setup = new TestSetup();
  setup.run();
}

module.exports = TestSetup;

