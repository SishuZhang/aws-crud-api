const AWS = require('aws-sdk');
const { handler } = require('../../../handlers/delete');

describe('Delete Handler', () => {
  let mockDynamoDB;

  beforeEach(() => {
    mockDynamoDB = new AWS.DynamoDB.DocumentClient();
    jest.clearAllMocks();
  });

  it('should delete an order successfully', async () => {
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

    // Mock DynamoDB delete response
    mockDynamoDB.delete().promise.mockResolvedValueOnce({});

    const event = {
      pathParameters: {
        id: '123'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order deleted successfully');

    // Verify DynamoDB was called correctly
    expect(mockDynamoDB.delete).toHaveBeenCalledWith(expect.objectContaining({
      TableName: 'test-table',
      Key: {
        id: '123'
      }
    }));
  });

  it('should return 404 when order is not found', async () => {
    // Mock DynamoDB get response with no item
    mockDynamoDB.get().promise.mockResolvedValueOnce({});

    const event = {
      pathParameters: {
        id: 'nonexistent'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order not found');
  });

  it('should handle missing ID parameter', async () => {
    const event = {
      pathParameters: {}
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order ID is required');
  });

  it('should handle DynamoDB errors', async () => {
    // Mock DynamoDB get response
    mockDynamoDB.get().promise.mockResolvedValueOnce({
      Item: {
        id: '123',
        customerName: 'John Doe'
      }
    });

    // Mock DynamoDB delete error
    mockDynamoDB.delete().promise.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = {
      pathParameters: {
        id: '123'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error deleting order');
    expect(body.error).toBe('DynamoDB error');
  });
}); 