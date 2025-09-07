const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Starting global setup...');
  
  // Wait for the API to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let retries = 10;
  let apiReady = false;
  
  while (retries > 0 && !apiReady) {
    try {
      console.log(`⏳ Checking API availability (${11 - retries}/10)...`);
      
      // Try to connect to the API with a simple request
      const response = await page.goto('http://localhost:8000/orders', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      if (response && (response.status() < 500 || response.status() === 200)) {
        apiReady = true;
        console.log('✅ API is ready!');
      } else {
        console.log(`❌ API returned status: ${response ? response.status() : 'no response'}`);
      }
    } catch (error) {
      console.log(`❌ API not ready yet: ${error.message}`);
      await page.waitForTimeout(3000);
      retries--;
    }
  }
  
  await browser.close();
  
  if (!apiReady) {
    console.log('⚠️ API not ready, but continuing with tests...');
    console.log('Make sure to start the API server manually: npm run offline');
  } else {
    console.log('🎉 Global setup completed successfully!');
  }
}

module.exports = globalSetup;

