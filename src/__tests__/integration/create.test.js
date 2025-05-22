const request = require('supertest');
const AWS = require('aws-sdk');
const { handler } = require('../../handlers/create');

// Mock the AWS SDK
jest.mock('aws-sdk', () => {
  const mockDynamoDB = {
    put: jest.fn().mockReturnThis(),
    promise: jest.fn()
  };
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDynamoDB)
    }
  };
});

describe('Create Order Integration', () => {
  let mockDynamoDB;

  beforeEach(() => {
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    jest.clearAllMocks();
  });

  it('should create a new order through API Gateway', async () => {
    // Mock successful DynamoDB response
    mockDynamoDB.put().promise.mockResolvedValueOnce({});

    const orderData = {
      customerName: 'John Doe',
      items: ['item1', 'item2'],
      shippingAddress: '123 Main St'
    };

    const event = {
      body: JSON.stringify(orderData)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    
    // Verify response structure
    expect(body).toHaveProperty('message', 'Order created successfully');
    expect(body).toHaveProperty('trackingNumber');
    expect(body).toHaveProperty('status', 'PENDING');
    expect(body.trackingNumber).toMatch(/^TRK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // Verify DynamoDB interaction
    expect(mockDynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
      TableName: process.env.DYNAMODB_TABLE,
      Item: expect.objectContaining({
        customerName: orderData.customerName,
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        status: 'PENDING'
      })
    }));
  });

  it('should handle missing required fields', async () => {
    const invalidOrderData = {
      customerName: 'John Doe'
      // Missing items and shippingAddress
    };

    const event = {
      body: JSON.stringify(invalidOrderData)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error creating order');
    expect(body.error).toContain('Missing required fields');
  });

  it('should handle empty items array', async () => {
    const invalidOrderData = {
      customerName: 'John Doe',
      items: [],
      shippingAddress: '123 Main St'
    };

    const event = {
      body: JSON.stringify(invalidOrderData)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error creating order');
    expect(body.error).toContain('Items must be a non-empty array');
  });

  it('should handle DynamoDB errors gracefully', async () => {
    // Mock DynamoDB error
    mockDynamoDB.put().promise.mockRejectedValueOnce(new Error('DynamoDB error'));

    const orderData = {
      customerName: 'John Doe',
      items: ['item1', 'item2'],
      shippingAddress: '123 Main St'
    };

    const event = {
      body: JSON.stringify(orderData)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error creating order');
    expect(body.error).toBe('DynamoDB error');
  });
}); 