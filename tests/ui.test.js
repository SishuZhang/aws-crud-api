const { test, expect } = require('@playwright/test');

test.describe('UI Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/public/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.container')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.form-row')).toHaveCSS('flex-direction', 'column');
  });

  test('should display loading states', async ({ page }) => {
    // Click refresh orders to trigger loading
    await page.click('text=Refresh Orders');
    
    // Check if loading spinner is visible
    await expect(page.locator('#listLoading')).toBeVisible();
    await expect(page.locator('.spinner')).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    // Test required field validation
    await page.click('button[type="submit"]');
    
    // Check if browser validation is triggered
    const customerNameInput = page.locator('#customerName');
    await expect(customerNameInput).toHaveAttribute('required');
    
    // Test HTML5 validation
    const validity = await customerNameInput.evaluate(el => el.validity.valid);
    expect(validity).toBe(false);
  });

  test('should add and remove items dynamically', async ({ page }) => {
    // Check initial item count
    let itemInputs = await page.locator('.item-input').count();
    expect(itemInputs).toBe(1);
    
    // Add an item
    await page.click('.add-item');
    itemInputs = await page.locator('.item-input').count();
    expect(itemInputs).toBe(2);
    
    // Add another item
    await page.click('.add-item');
    itemInputs = await page.locator('.item-input').count();
    expect(itemInputs).toBe(3);
    
    // Remove an item
    await page.click('.remove-item').nth(1);
    itemInputs = await page.locator('.item-input').count();
    expect(itemInputs).toBe(2);
  });

  test('should display order items correctly', async ({ page }) => {
    // Create an order first
    await page.fill('#customerName', 'UI Test Customer');
    await page.selectOption('.product-select', 'apple');
    await page.fill('input[name="quantity"]', '3');
    await page.fill('#shippingAddress', '123 UI Test St, Test City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for order creation
    await page.waitForSelector('#createResponse', { state: 'visible' });
    
    // Refresh orders list
    await page.click('text=Refresh Orders');
    await page.waitForSelector('#listLoading', { state: 'hidden' });
    
    // Check if order is displayed in the list
    const orderItem = page.locator('.order-item').first();
    await expect(orderItem).toBeVisible();
    await expect(orderItem.locator('.order-id')).toContainText('Order:');
    await expect(orderItem.locator('.order-status')).toContainText('PENDING');
  });

  test('should handle empty states', async ({ page }) => {
    // Clear any existing orders by refreshing
    await page.click('text=Refresh Orders');
    await page.waitForSelector('#listLoading', { state: 'hidden' });
    
    // Check if empty state is handled
    const ordersList = page.locator('#ordersList');
    const isEmpty = await ordersList.textContent();
    
    // Either should show "No orders found" or have some orders
    expect(isEmpty).toBeTruthy();
  });

  test('should show proper error messages', async ({ page }) => {
    // Try to get a non-existent order
    await page.fill('#orderId', 'invalid-id');
    await page.click('text=Get Order');
    
    // Wait for response
    await page.waitForSelector('#getResponse', { state: 'visible' });
    
    // Check if error response is styled correctly
    const response = page.locator('#getResponse');
    await expect(response).toHaveClass(/error/);
  });

  test('should show success messages', async ({ page }) => {
    // Create a valid order
    await page.fill('#customerName', 'Success Test Customer');
    await page.selectOption('.product-select', 'pear');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('#shippingAddress', '456 Success St, Success City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('#createResponse', { state: 'visible' });
    
    // Check if success response is styled correctly
    const response = page.locator('#createResponse');
    await expect(response).toHaveClass(/success/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('#customerName')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('.product-select')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="quantity"]')).toBeFocused();
  });

  test('should handle form reset after successful submission', async ({ page }) => {
    // Fill and submit form
    await page.fill('#customerName', 'Reset Test Customer');
    await page.selectOption('.product-select', 'apple');
    await page.fill('input[name="quantity"]', '2');
    await page.fill('#shippingAddress', '789 Reset St, Reset City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for successful response
    await page.waitForSelector('#createResponse', { state: 'visible' });
    const response = await page.textContent('#createResponse');
    const responseData = JSON.parse(response);
    
    if (responseData.message === 'Order created successfully') {
      // Check if form was reset
      await expect(page.locator('#customerName')).toHaveValue('');
      await expect(page.locator('#shippingAddress')).toHaveValue('');
      
      // Check if items container was reset to single item
      const itemCount = await page.locator('.item-input').count();
      expect(itemCount).toBe(1);
    }
  });

  test('should display API status correctly', async ({ page }) => {
    // Check if API status indicator is present
    const apiStatus = page.locator('#apiStatus');
    await expect(apiStatus).toBeVisible();
    
    // Should show either "API Online" or "API Offline"
    const statusText = await apiStatus.textContent();
    expect(['API Online', 'API Offline', 'API Error', 'Checking API...']).toContain(statusText);
  });

  test('should handle confirmation dialogs', async ({ page }) => {
    // Create an order first
    await page.fill('#customerName', 'Dialog Test Customer');
    await page.selectOption('.product-select', 'orange');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('#shippingAddress', '321 Dialog St, Dialog City, USA');
    await page.click('button[type="submit"]');
    
    // Wait for order creation
    await page.waitForSelector('#createResponse', { state: 'visible' });
    const createResponse = await page.textContent('#createResponse');
    const createData = JSON.parse(createResponse);
    
    if (createData.orderId) {
      // Test delete confirmation dialog
      await page.fill('#deleteOrderId', createData.orderId);
      
      // Set up dialog handler
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain(createData.orderId);
        dialog.accept();
      });
      
      await page.click('text=Delete Order');
      
      // Wait for response
      await page.waitForSelector('#deleteResponse', { state: 'visible' });
    }
  });
});

