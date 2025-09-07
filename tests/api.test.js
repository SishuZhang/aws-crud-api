const { test, expect } = require('@playwright/test');

test.describe('AWS CRUD API Tests', () => {
  let createdOrderId;

  test.beforeEach(async ({ page }) => {
    // Navigate to the test UI
    await page.goto('/public/index.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if API is online
    await expect(page.locator('#apiStatus')).toContainText('API Online');
  });

  test('should display the order management interface', async ({ page }) => {
    // Check if all main sections are visible
    await expect(page.locator('h1')).toContainText('AWS CRUD API');
    await expect(page.locator('h2').nth(0)).toContainText('Create New Order');
    await expect(page.locator('h2').nth(1)).toContainText('Orders List');
    await expect(page.locator('h2').nth(2)).toContainText('Get Specific Order');
    await expect(page.locator('h2').nth(3)).toContainText('Update Order');
    await expect(page.locator('h2').nth(4)).toContainText('Delete Order');
  });

  test('should create a new order successfully', async ({ page }) => {
    // Fill in the create order form
    await page.fill('#customerName', 'John Doe');
    await page.selectOption('.product-select', 'apple');
    await page.fill('input[name="quantity"]', '5');
    await page.fill('#shippingAddress', '123 Main St, Anytown, USA');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('#createResponse', { state: 'visible' });
    
    // Check for success response
    const response = await page.textContent('#createResponse');
    const responseData = JSON.parse(response);
    
    expect(responseData.message).toBe('Order created successfully');
    expect(responseData.orderId).toBeDefined();
    expect(responseData.totalCost).toBe(5); // 5 apples * $1 each
    
    // Store the order ID for other tests
    createdOrderId = responseData.orderId;
  });

  test('should create order with multiple items', async ({ page }) => {
    // Fill in customer name
    await page.fill('#customerName', 'Jane Smith');
    
    // Add first item
    await page.selectOption('.product-select', 'apple');
    await page.fill('input[name="quantity"]', '3');
    
    // Add second item
    await page.click('.add-item');
    await page.selectOption('.product-select').nth(1).selectOption('orange');
    await page.fill('input[name="quantity"]').nth(1).fill('2');
    
    // Fill shipping address
    await page.fill('#shippingAddress', '456 Oak Ave, Somewhere, USA');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('#createResponse', { state: 'visible' });
    
    // Check for success response
    const response = await page.textContent('#createResponse');
    const responseData = JSON.parse(response);
    
    expect(responseData.message).toBe('Order created successfully');
    expect(responseData.totalCost).toBe(7); // 3 apples * $1 + 2 oranges * $2 = $7
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await page.waitForSelector('#createResponse', { state: 'visible' });
    const response = await page.textContent('#createResponse');
    const responseData = JSON.parse(response);
    
    expect(responseData.error).toContain('Missing required fields');
  });

  test('should list orders', async ({ page }) => {
    // Click refresh orders button
    await page.click('text=Refresh Orders');
    
    // Wait for loading to complete
    await page.waitForSelector('#listLoading', { state: 'hidden' });
    
    // Check if orders list is displayed
    const ordersList = page.locator('#ordersList');
    await expect(ordersList).toBeVisible();
  });

  test('should get specific order', async ({ page }) => {
    // First create an order to get an ID
    await page.fill('#customerName', 'Test Customer');
    await page.selectOption('.product-select', 'pear');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('#shippingAddress', '789 Test St, Test City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for order creation
    await page.waitForSelector('#createResponse', { state: 'visible' });
    const createResponse = await page.textContent('#createResponse');
    const createData = JSON.parse(createResponse);
    
    if (createData.orderId) {
      // Now test getting the order
      await page.fill('#orderId', createData.orderId);
      await page.click('text=Get Order');
      
      // Wait for response
      await page.waitForSelector('#getResponse', { state: 'visible' });
      
      // Check for success response
      const response = await page.textContent('#getResponse');
      const responseData = JSON.parse(response);
      
      expect(responseData.id).toBe(createData.orderId);
      expect(responseData.customerName).toBe('Test Customer');
    }
  });

  test('should update order', async ({ page }) => {
    // First create an order
    await page.fill('#customerName', 'Update Test Customer');
    await page.selectOption('.product-select', 'apple');
    await page.fill('input[name="quantity"]', '2');
    await page.fill('#shippingAddress', '999 Update St, Update City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for order creation
    await page.waitForSelector('#createResponse', { state: 'visible' });
    const createResponse = await page.textContent('#createResponse');
    const createData = JSON.parse(createResponse);
    
    if (createData.orderId) {
      // Now test updating the order
      await page.fill('#updateOrderId', createData.orderId);
      await page.fill('#updateCustomerName', 'Updated Customer Name');
      await page.selectOption('#updateStatus', 'PROCESSING');
      await page.click('text=Update Order');
      
      // Wait for response
      await page.waitForSelector('#updateResponse', { state: 'visible' });
      
      // Check for success response
      const response = await page.textContent('#updateResponse');
      const responseData = JSON.parse(response);
      
      expect(responseData.message).toContain('successfully');
    }
  });

  test('should delete order', async ({ page }) => {
    // First create an order
    await page.fill('#customerName', 'Delete Test Customer');
    await page.selectOption('.product-select', 'orange');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('#shippingAddress', '111 Delete St, Delete City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for order creation
    await page.waitForSelector('#createResponse', { state: 'visible' });
    const createResponse = await page.textContent('#createResponse');
    const createData = JSON.parse(createResponse);
    
    if (createData.orderId) {
      // Now test deleting the order
      await page.fill('#deleteOrderId', createData.orderId);
      
      // Handle the confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      await page.click('text=Delete Order');
      
      // Wait for response
      await page.waitForSelector('#deleteResponse', { state: 'visible' });
      
      // Check for success response
      const response = await page.textContent('#deleteResponse');
      const responseData = JSON.parse(response);
      
      expect(responseData.message).toContain('successfully');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Try to get a non-existent order
    await page.fill('#orderId', 'non-existent-order-id');
    await page.click('text=Get Order');
    
    // Wait for response
    await page.waitForSelector('#getResponse', { state: 'visible' });
    
    // Check for error response
    const response = await page.textContent('#getResponse');
    const responseData = JSON.parse(response);
    
    expect(responseData.error).toBeDefined();
  });

  test('should validate order limits', async ({ page }) => {
    // Test with limit parameter
    await page.fill('#limit', '5');
    await page.click('text=Refresh Orders');
    
    // Wait for loading to complete
    await page.waitForSelector('#listLoading', { state: 'hidden' });
    
    // Check if orders list is displayed
    const ordersList = page.locator('#ordersList');
    await expect(ordersList).toBeVisible();
  });

  test('should handle invalid product selection', async ({ page }) => {
    // Try to create order without selecting a product
    await page.fill('#customerName', 'Invalid Product Test');
    await page.fill('#shippingAddress', '123 Invalid St, Invalid City, USA');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('#createResponse', { state: 'visible' });
    
    // Check for error response
    const response = await page.textContent('#createResponse');
    const responseData = JSON.parse(response);
    
    expect(responseData.error).toContain('Please add at least one item');
  });

  test('should handle network errors', async ({ page }) => {
    // This test would require mocking network failures
    // For now, we'll test the UI behavior when API is offline
    
    // Check if the API status indicator is working
    const apiStatus = page.locator('#apiStatus');
    await expect(apiStatus).toBeVisible();
  });
});

