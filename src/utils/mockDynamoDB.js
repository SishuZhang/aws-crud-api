/**
 * Mock DynamoDB implementation for local testing
 * This simulates DynamoDB behavior without requiring actual DynamoDB Local
 */

class MockDynamoDB {
  constructor() {
    this.tables = {
      'aws-crud-api-dev-orders': [],
      'aws-crud-api-dev-products': [
        { productName: 'apple', price: 1 },
        { productName: 'orange', price: 2 },
        { productName: 'pear', price: 3 }
      ]
    };
  }

  async scan(params) {
    const tableName = params.TableName;
    const items = this.tables[tableName] || [];
    
    console.log(`Mock DynamoDB: Scanning table ${tableName}, found ${items.length} items`);
    
    return Promise.resolve({
      Items: items,
      Count: items.length,
      ScannedCount: items.length
    });
  }

  async get(params) {
    const tableName = params.TableName;
    const key = params.Key;
    const items = this.tables[tableName] || [];
    
    console.log(`Mock DynamoDB: Getting item from ${tableName} with key:`, key);
    
    // Find item by key
    const item = items.find(item => {
      return Object.keys(key).every(keyField => item[keyField] === key[keyField]);
    });
    
    return Promise.resolve({
      Item: item || null
    });
  }

  async put(params) {
    const tableName = params.TableName;
    const item = params.Item;
    
    console.log(`Mock DynamoDB: Putting item to ${tableName}:`, item);
    
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    
    // Remove existing item with same key if it exists
    const keyFields = this.getKeyFields(tableName);
    if (keyFields.length > 0) {
      this.tables[tableName] = this.tables[tableName].filter(existingItem => {
        return !keyFields.every(keyField => existingItem[keyField] === item[keyField]);
      });
    }
    
    // Add new item
    this.tables[tableName].push(item);
    
    return Promise.resolve({});
  }

  async update(params) {
    const tableName = params.TableName;
    const key = params.Key;
    const updateExpression = params.UpdateExpression;
    const expressionAttributeValues = params.ExpressionAttributeValues || {};
    
    console.log(`Mock DynamoDB: Updating item in ${tableName} with key:`, key);
    
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    
    // Find existing item
    const itemIndex = this.tables[tableName].findIndex(item => {
      return Object.keys(key).every(keyField => item[keyField] === key[keyField]);
    });
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    // Simple update logic - in real implementation this would parse UpdateExpression
    const updatedItem = { ...this.tables[tableName][itemIndex] };
    
    // Apply updates from expressionAttributeValues
    Object.keys(expressionAttributeValues).forEach(key => {
      const value = expressionAttributeValues[key];
      const fieldName = key.replace(':', '');
      updatedItem[fieldName] = value;
    });
    
    this.tables[tableName][itemIndex] = updatedItem;
    
    return Promise.resolve({
      Attributes: updatedItem
    });
  }

  async delete(params) {
    const tableName = params.TableName;
    const key = params.Key;
    
    console.log(`Mock DynamoDB: Deleting item from ${tableName} with key:`, key);
    
    if (!this.tables[tableName]) {
      this.tables[tableName] = [];
    }
    
    // Remove item with matching key
    this.tables[tableName] = this.tables[tableName].filter(item => {
      return !Object.keys(key).every(keyField => item[keyField] === key[keyField]);
    });
    
    return Promise.resolve({});
  }

  getKeyFields(tableName) {
    // Define key fields for each table
    const keyFields = {
      'aws-crud-api-dev-orders': ['id'],
      'aws-crud-api-dev-products': ['productName']
    };
    
    return keyFields[tableName] || [];
  }

  // Method to reset all data (useful for testing)
  reset() {
    this.tables = {
      'aws-crud-api-dev-orders': [],
      'aws-crud-api-dev-products': [
        { productName: 'apple', price: 1 },
        { productName: 'orange', price: 2 },
        { productName: 'pear', price: 3 }
      ]
    };
  }

  // Method to get all data (useful for debugging)
  getAllData() {
    return this.tables;
  }
}

// Create a singleton instance
const mockDynamoDB = new MockDynamoDB();

// Create a DocumentClient-like interface
class MockDocumentClient {
  constructor() {
    // Use the singleton instance
    this.mockDB = mockDynamoDB;
  }

  scan(params) {
    return {
      promise: () => this.mockDB.scan(params)
    };
  }

  get(params) {
    return {
      promise: () => this.mockDB.get(params)
    };
  }

  put(params) {
    return {
      promise: () => this.mockDB.put(params)
    };
  }

  update(params) {
    return {
      promise: () => this.mockDB.update(params)
    };
  }

  delete(params) {
    return {
      promise: () => this.mockDB.delete(params)
    };
  }
}

module.exports = {
  MockDocumentClient,
  mockDynamoDB
};
