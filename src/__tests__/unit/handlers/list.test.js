const AWS = require('aws-sdk');
const { handler } = require('../../../handlers/list');

describe('List Handler', () => {
  let mockDynamoDB;

  beforeEach(() => {
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    jest.clearAllMocks();
  });

  it('should list all orders successfully', async () => {
    const mockOrders = [
      {
        id: '123',
        customerName: 'John Doe',
        items: ['item1', 'item2'],
        shippingAddress: '123 Main St',
        status: 'PENDING',
        trackingNumber: 'TRK-1234-5678-9012'
      },
      {
        id: '456',
        customerName: 'Jane Smith',
        items: ['item3'],
        shippingAddress: '456 Oak St',
        status: 'SHIPPED',
        trackingNumber: 'TRK-5678-9012-3456'
      }
    ];

    // Mock DynamoDB scan response
    mockDynamoDB.scan().promise.mockResolvedValueOnce({
      Items: mockOrders
    });

    const event = {};

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual(mockOrders);

    // Verify DynamoDB was called correctly
    expect(mockDynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
      TableName: 'test-table'
    }));
  });

  it('should handle empty orders list', async () => {
    // Mock DynamoDB scan response with no items
    mockDynamoDB.scan().promise.mockResolvedValueOnce({
      Items: []
    });

    const event = {};

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual([]);
  });

  it('should handle DynamoDB errors', async () => {
    // Mock DynamoDB error
    mockDynamoDB.scan().promise.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = {};

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error retrieving orders');
    expect(body.error).toBe('DynamoDB error');
  });

  it('should handle pagination', async () => {
    const mockOrders = [
      {
        id: '123',
        customerName: 'John Doe',
        items: ['item1', 'item2'],
        shippingAddress: '123 Main St',
        status: 'PENDING',
        trackingNumber: 'TRK-1234-5678-9012'
      }
    ];

    // Mock DynamoDB scan response with LastEvaluatedKey
    mockDynamoDB.scan().promise.mockResolvedValueOnce({
      Items: mockOrders,
      LastEvaluatedKey: { id: '123' }
    });

    const event = {
      queryStringParameters: {
        limit: '1'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual(mockOrders);

    // Verify DynamoDB was called with limit
    expect(mockDynamoDB.scan).toHaveBeenCalledWith(expect.objectContaining({
      TableName: 'test-table',
      Limit: 1
    }));
  });
}); 