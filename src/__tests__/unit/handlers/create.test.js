const AWS = require('aws-sdk');
const { handler } = require('../../../handlers/create');

describe('Create Handler', () => {
  let mockDynamoDB;

  beforeEach(() => {
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    jest.clearAllMocks();
  });

  it('should create a new order successfully', async () => {
    // Mock DynamoDB put response
    mockDynamoDB.put().promise.mockResolvedValueOnce({});

    const event = {
      body: JSON.stringify({
        customerName: 'John Doe',
        items: ['item1', 'item2'],
        shippingAddress: '123 Main St'
      })
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order created successfully');
    expect(body.trackingNumber).toMatch(/^TRK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(body.status).toBe('PENDING');

    // Verify DynamoDB was called correctly
    expect(mockDynamoDB.put).toHaveBeenCalledWith(expect.objectContaining({
      TableName: 'test-table',
      Item: expect.objectContaining({
        customerName: 'John Doe',
        items: ['item1', 'item2'],
        shippingAddress: '123 Main St',
        status: 'PENDING'
      })
    }));
  });

  it('should handle invalid input', async () => {
    const event = {
      body: 'invalid json'
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error creating order');
  });

  it('should handle DynamoDB errors', async () => {
    // Mock DynamoDB error
    mockDynamoDB.put().promise.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = {
      body: JSON.stringify({
        customerName: 'John Doe',
        items: ['item1', 'item2'],
        shippingAddress: '123 Main St'
      })
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error creating order');
    expect(body.error).toBe('DynamoDB error');
  });
}); 