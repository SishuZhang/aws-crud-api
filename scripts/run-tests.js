#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      jest: null,
      playwright: null,
      overall: 'pending'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    this.log(`Starting: ${description}`);
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      this.log(`Completed: ${description}`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`Failed: ${description} - ${error.message}`, 'error');
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async runJestTests() {
    this.log('Running Jest tests (Unit & Integration)...');
    
    const result = await this.runCommand('npm run test:coverage', 'Jest tests with coverage');
    this.results.jest = result;
    
    return result;
  }

  async runPlaywrightTests() {
    this.log('Running Playwright tests (E2E UI)...');
    
    const result = await this.runCommand('npm run test:playwright', 'Playwright E2E tests');
    this.results.playwright = result;
    
    return result;
  }

  generateReport() {
    this.log('Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        coverage: null
      }
    };

    // Parse Jest results
    if (this.results.jest && this.results.jest.success) {
      // Try to read coverage data
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
      if (fs.existsSync(coveragePath)) {
        try {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          report.summary.coverage = this.calculateCoverage(coverageData);
        } catch (error) {
          this.log('Could not parse coverage data', 'warning');
        }
      }
    }

    // Parse Playwright results
    if (this.results.playwright && this.results.playwright.success) {
      const resultsPath = path.join(process.cwd(), 'test-results.json');
      if (fs.existsSync(resultsPath)) {
        try {
          const playwrightResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          report.summary.totalTests += playwrightResults.stats.total;
          report.summary.passedTests += playwrightResults.stats.passed;
          report.summary.failedTests += playwrightResults.stats.failed;
        } catch (error) {
          this.log('Could not parse Playwright results', 'warning');
        }
      }
    }

    // Determine overall status
    const allPassed = this.results.jest?.success && this.results.playwright?.success;
    report.results.overall = allPassed ? 'passed' : 'failed';

    // Write report
    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to: ${reportPath}`);
    
    return report;
  }

  calculateCoverage(coverageData) {
    const files = Object.values(coverageData);
    let totalLines = 0;
    let coveredLines = 0;

    files.forEach(file => {
      if (file.s) {
        const lines = Object.values(file.s);
        totalLines += lines.length;
        coveredLines += lines.filter(count => count > 0).length;
      }
    });

    return {
      totalLines,
      coveredLines,
      percentage: totalLines > 0 ? ((coveredLines / totalLines) * 100).toFixed(2) : 0
    };
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🕐 Timestamp: ${report.timestamp}`);
    console.log(`\n📈 Overall Status: ${report.results.overall.toUpperCase()}`);
    
    console.log('\n📋 Test Results:');
    console.log(`   Jest Tests: ${report.results.jest?.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Playwright Tests: ${report.results.playwright?.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (report.summary.coverage) {
      console.log(`\n📊 Code Coverage: ${report.summary.coverage.percentage}%`);
      console.log(`   Covered Lines: ${report.summary.coverage.coveredLines}/${report.summary.coverage.totalLines}`);
    }
    
    if (report.summary.totalTests > 0) {
      console.log(`\n🧪 Test Statistics:`);
      console.log(`   Total Tests: ${report.summary.totalTests}`);
      console.log(`   Passed: ${report.summary.passedTests}`);
      console.log(`   Failed: ${report.summary.failedTests}`);
    }
    
    console.log('\n📁 Reports Generated:');
    console.log('   - test-report.json (this summary)');
    
    if (fs.existsSync('coverage/lcov-report/index.html')) {
      console.log('   - coverage/lcov-report/index.html (Jest coverage)');
    }
    
    if (fs.existsSync('playwright-report/index.html')) {
      console.log('   - playwright-report/index.html (Playwright report)');
    }
    
    console.log('\n' + '='.repeat(60));
  }

  async run() {
    console.log('🚀 Starting comprehensive test execution...\n');
    
    try {
      // Run Jest tests
      await this.runJestTests();
      
      // Run Playwright tests
      await this.runPlaywrightTests();
      
      // Generate report
      const report = this.generateReport();
      
      // Print summary
      this.printSummary(report);
      
      // Exit with appropriate code
      process.exit(report.results.overall === 'passed' ? 0 : 1);
      
    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the test runner
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;

