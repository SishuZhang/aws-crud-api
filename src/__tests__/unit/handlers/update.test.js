const AWS = require('aws-sdk');
const { handler } = require('../../../handlers/update');

describe('Update Handler', () => {
  let mockDynamoDB;

  beforeEach(() => {
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    jest.clearAllMocks();
  });

  it('should update an order successfully', async () => {
    const mockOrder = {
      id: '123',
      customerName: 'John Doe',
      items: ['item1', 'item2'],
      shippingAddress: '123 Main St',
      status: 'PENDING',
      trackingNumber: 'TRK-1234-5678-9012'
    };

    // Mock DynamoDB get response
    mockDynamoDB.get().promise.mockResolvedValueOnce({
      Item: mockOrder
    });

    // Mock DynamoDB update response
    mockDynamoDB.update().promise.mockResolvedValueOnce({});

    const updateData = {
      customerName: 'John Updated',
      items: ['item1', 'item2', 'item3'],
      shippingAddress: '456 New St'
    };

    const event = {
      pathParameters: {
        id: '123'
      },
      body: JSON.stringify(updateData)
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order updated successfully');

    // Verify DynamoDB was called correctly
    expect(mockDynamoDB.update).toHaveBeenCalledWith(expect.objectContaining({
      TableName: 'test-table',
      Key: { id: '123' },
      UpdateExpression: expect.any(String),
      ExpressionAttributeValues: expect.objectContaining({
        ':customerName': updateData.customerName,
        ':items': updateData.items,
        ':shippingAddress': updateData.shippingAddress
      }),
      ReturnValues: 'ALL_NEW'
    }));
  });

  it('should return 404 when order is not found', async () => {
    // Mock DynamoDB get response with no item
    mockDynamoDB.get().promise.mockResolvedValueOnce({});

    const event = {
      pathParameters: {
        id: 'nonexistent'
      },
      body: JSON.stringify({
        customerName: 'John Updated'
      })
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order not found');
  });

  it('should handle missing ID parameter', async () => {
    const event = {
      pathParameters: {},
      body: JSON.stringify({
        customerName: 'John Updated'
      })
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order ID is required');
  });

  it('should handle invalid request body', async () => {
    const event = {
      pathParameters: {
        id: '123'
      },
      body: 'invalid json'
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error updating order');
  });

  it('should handle DynamoDB errors', async () => {
    // Mock DynamoDB get response
    mockDynamoDB.get().promise.mockResolvedValueOnce({
      Item: {
        id: '123',
        customerName: 'John Doe'
      }
    });

    // Mock DynamoDB update error
    mockDynamoDB.update().promise.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = {
      pathParameters: {
        id: '123'
      },
      body: JSON.stringify({
        customerName: 'John Updated'
      })
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error updating order');
    expect(body.error).toBe('DynamoDB error');
  });
}); 