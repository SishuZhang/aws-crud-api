// __tests__/unit/create.test.js

// Mock process.env before requiring the handler
const mockProductsTable = 'ProductsTableTest';
const mockOrdersTable = 'OrdersTableTest';
process.env.PRODUCTS_TABLE = mockProductsTable;
process.env.ORDERS_TABLE = mockOrdersTable;

const { handler } = require('../../src/handlers/create');
const AWS = require('aws-sdk');

jest.mock('aws-sdk', () => {
  const DocumentClient = {
    get: jest.fn(),
    put: jest.fn(),
    scan: jest.fn(), // Add mock for scan
  };
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => DocumentClient)
    }
  };
});

const mockGet = new AWS.DynamoDB.DocumentClient().get;
const mockPut = new AWS.DynamoDB.DocumentClient().put;
const mockScan = new AWS.DynamoDB.DocumentClient().scan; // Get reference to the scan mock

describe('create handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks before each test
    mockGet.mockReset();
    mockPut.mockReset();
    mockScan.mockReset();
  });

  it('returns 201 for a valid order', async () => {
    // Mock product existence check for 'Apple'
    mockGet.mockImplementationOnce(({ TableName, Key }) => ({
      promise: async () => {
        // Check TableName in mock
        if (TableName === mockProductsTable && Key.productName === 'Apple') {
          return { Item: { productName: 'Apple', price: 1.0 } }; // Mock existing product with details
        }
        console.error(`Unexpected get call - TableName: ${TableName}, Key: ${JSON.stringify(Key)}`);
        return {}; // Product not found or wrong table
      },
    }));

    // Mock successful order creation
    mockPut.mockImplementationOnce(({ TableName, Item }) => ({
       promise: async () => { // Check TableName in mock
           if(TableName === mockOrdersTable) return {};
           console.error(`Unexpected put call - TableName: ${TableName}, Item: ${JSON.stringify(Item)}`);
           throw new Error(`Unexpected TableName: ${TableName}`);
       }
    }));

    // Mock scan to return valid products (Apple is required for the valid order test)
    mockScan.mockImplementationOnce(({ TableName, ProjectionExpression }) => ({
        promise: async () => {
             // Check TableName in mock
            if(TableName === mockProductsTable && ProjectionExpression === 'productName') {
                return { Items: [{ productName: 'Apple', price: 1.0 }] };
            }
            console.error(`Unexpected scan call - TableName: ${TableName}, ProjectionExpression: ${ProjectionExpression}`);
             throw new Error(`Unexpected TableName or ProjectionExpression for scan: ${TableName}, ${ProjectionExpression}`);
        },
    }));

    const validEvent = {
      body: JSON.stringify({
        customerName: 'John Doe',
        // Modified items structure to match expected input
        items: { 'Apple': 2 },
        shippingAddress: '123 Main St'
      })
    };

    const response = await handler(validEvent);

    expect(mockGet).toHaveBeenCalledWith({
      TableName: mockProductsTable,
      Key: { productName: 'Apple' }
    });

    // Expect put to be called with the correct table and data
    expect(mockPut).toHaveBeenCalledWith({
        TableName: mockOrdersTable,
        Item: expect.objectContaining({
            customerName: 'John Doe',
            items: expect.objectContaining({
                'Apple': expect.objectContaining({
                    quantity: 2,
                    price: 1.0,
                    subtotal: 2.0
                })
            }),
            shippingAddress: '123 Main St'
            // Add other expected fields like id, totalCost, status, createdAt, updatedAt if needed
        })
    });

    expect(response.statusCode).toBe(201);
  });

  it('returns 400 for invalid JSON', async () => {
    // This test case remains the same as the handler's JSON parsing should be tested.
    const invalidEvent = {
      body: 'invalid json'
    };

    const response = await handler(invalidEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe('Invalid JSON in request body.');
  });

  it('returns 400 for missing fields', async () => {
    // No change needed here
    const missingFieldsEvent = {
      body: JSON.stringify({})
    };

    const response = await handler(missingFieldsEvent);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/Missing required fields/);
  });

  it('returns 400 for invalid product', async () => {
    // Mock product check - product not found
    mockGet.mockImplementationOnce(({ TableName, Key }) => ({
      promise: async () => {
         if (TableName === mockProductsTable && Key.productName === 'NonExistentProduct') {
             return {}; // Product not found
         }
         // Add a case for the valid product check during scan (if handler calls get for each item during scan validation)
         if (TableName === mockProductsTable && Key.productName === 'Apple') {
            return { Item: { productName: 'Apple', price: 1.0 } };
         }
         console.error(`Unexpected get call in invalid product test - TableName: ${TableName}, Key: ${JSON.stringify(Key)}`);
         throw new Error(`Unexpected TableName or Key for get: ${TableName}, ${Key.productName}`);
      },
    }));

    // Mock scan to return valid products (does not include 'NonExistentProduct')
    mockScan.mockImplementationOnce(({ TableName, ProjectionExpression }) => ({
        promise: async () => {
            if(TableName === mockProductsTable && ProjectionExpression === 'productName') {
                return { Items: [{ productName: 'Apple', price: 1.0 }] };
            }
             console.error(`Unexpected scan call in invalid product test - TableName: ${TableName}, ProjectionExpression: ${ProjectionExpression}`);
            throw new Error(`Unexpected TableName or ProjectionExpression for scan: ${TableName}, ${ProjectionExpression}`);
        },
    }));

    const invalidProductEvent = {
      body: JSON.stringify({
        customerName: 'John Doe',
        // Modified items structure
        items: { 'NonExistentProduct': 1 },
        shippingAddress: '123 Main St'
      })
    };

    const response = await handler(invalidProductEvent);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toMatch(/Invalid product/);
    expect(body.validProducts).toBeDefined();
    expect(Array.isArray(body.validProducts)).toBe(true);
    expect(body.validProducts).toEqual(['Apple']); // Expect the list of valid products
  });

});
