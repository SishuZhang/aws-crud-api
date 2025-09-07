/**
 * Test utilities for Playwright tests
 */

class TestHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Create a test order with given parameters
   */
  async createOrder(customerName = 'Test Customer', items = { apple: 1 }, shippingAddress = '123 Test St, Test City, USA') {
    // Fill in the create order form
    await this.page.fill('#customerName', customerName);
    
    // Clear existing items and add new ones
    await this.clearItems();
    await this.addItems(items);
    
    await this.page.fill('#shippingAddress', shippingAddress);
    
    // Submit the form
    await this.page.click('button[type="submit"]');
    
    // Wait for response
    await this.page.waitForSelector('#createResponse', { state: 'visible' });
    
    // Get response data
    const response = await this.page.textContent('#createResponse');
    return JSON.parse(response);
  }

  /**
   * Add items to the order form
   */
  async addItems(items) {
    const itemEntries = Object.entries(items);
    
    for (let i = 0; i < itemEntries.length; i++) {
      const [productId, quantity] = itemEntries[i];
      
      if (i > 0) {
        await this.page.click('.add-item');
      }
      
      await this.page.selectOption('.product-select').nth(i).selectOption(productId);
      await this.page.fill('input[name="quantity"]').nth(i).fill(quantity.toString());
    }
  }

  /**
   * Clear all items from the form
   */
  async clearItems() {
    const itemCount = await this.page.locator('.item-input').count();
    
    // Remove all items except the first one
    for (let i = itemCount - 1; i > 0; i--) {
      await this.page.click('.remove-item').nth(i);
    }
    
    // Clear the first item
    await this.page.selectOption('.product-select', '');
    await this.page.fill('input[name="quantity"]', '1');
  }

  /**
   * Get all orders from the list
   */
  async getOrders() {
    await this.page.click('text=Refresh Orders');
    await this.page.waitForSelector('#listLoading', { state: 'hidden' });
    
    const orderElements = await this.page.locator('.order-item').all();
    const orders = [];
    
    for (const element of orderElements) {
      const orderId = await element.locator('.order-id').textContent();
      const status = await element.locator('.order-status').textContent();
      const customer = await element.locator('.order-details p').first().textContent();
      
      orders.push({
        id: orderId.replace('Order: ', ''),
        status,
        customer: customer.replace('Customer: ', '')
      });
    }
    
    return orders;
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId) {
    await this.page.fill('#orderId', orderId);
    await this.page.click('text=Get Order');
    
    await this.page.waitForSelector('#getResponse', { state: 'visible' });
    const response = await this.page.textContent('#getResponse');
    return JSON.parse(response);
  }

  /**
   * Update an order
   */
  async updateOrder(orderId, updateData) {
    await this.page.fill('#updateOrderId', orderId);
    
    if (updateData.customerName) {
      await this.page.fill('#updateCustomerName', updateData.customerName);
    }
    
    if (updateData.shippingAddress) {
      await this.page.fill('#updateShippingAddress', updateData.shippingAddress);
    }
    
    if (updateData.status) {
      await this.page.selectOption('#updateStatus', updateData.status);
    }
    
    await this.page.click('text=Update Order');
    
    await this.page.waitForSelector('#updateResponse', { state: 'visible' });
    const response = await this.page.textContent('#updateResponse');
    return JSON.parse(response);
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId) {
    await this.page.fill('#deleteOrderId', orderId);
    
    // Handle confirmation dialog
    this.page.on('dialog', dialog => dialog.accept());
    
    await this.page.click('text=Delete Order');
    
    await this.page.waitForSelector('#deleteResponse', { state: 'visible' });
    const response = await this.page.textContent('#deleteResponse');
    return JSON.parse(response);
  }

  /**
   * Wait for API to be ready
   */
  async waitForApiReady() {
    await this.page.waitForFunction(() => {
      const status = document.querySelector('#apiStatus');
      return status && status.textContent === 'API Online';
    }, { timeout: 30000 });
  }

  /**
   * Check if response is successful
   */
  isSuccessResponse(response) {
    return response.message && response.message.includes('successfully');
  }

  /**
   * Check if response is an error
   */
  isErrorResponse(response) {
    return response.error || (response.message && response.message.includes('Error'));
  }

  /**
   * Generate random test data
   */
  generateTestData() {
    const customers = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
    const addresses = [
      '123 Main St, Anytown, USA',
      '456 Oak Ave, Somewhere, USA',
      '789 Pine Rd, Nowhere, USA',
      '321 Elm St, Everywhere, USA',
      '654 Maple Dr, Anywhere, USA'
    ];
    
    return {
      customerName: customers[Math.floor(Math.random() * customers.length)],
      shippingAddress: addresses[Math.floor(Math.random() * addresses.length)],
      items: this.generateRandomItems()
    };
  }

  /**
   * Generate random items for testing
   */
  generateRandomItems() {
    const products = ['apple', 'orange', 'pear'];
    const items = {};
    const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
    
    for (let i = 0; i < itemCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
      
      if (items[product]) {
        items[product] += quantity;
      } else {
        items[product] = quantity;
      }
    }
    
    return items;
  }
}

module.exports = { TestHelper };

