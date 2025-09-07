async function globalTeardown(config) {
  console.log('🧹 Starting global teardown...');
  
  // Add any cleanup logic here if needed
  // For example, cleaning up test data, stopping services, etc.
  
  console.log('✅ Global teardown completed!');
}

module.exports = globalTeardown;

