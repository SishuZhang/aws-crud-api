jest.mock('aws-sdk', () => {
  const mockGet = jest.fn();

  const DocumentClient = jest.fn(() => ({
    get: mockGet
  }));

  return {
    DynamoDB: {
      DocumentClient
    },
    __mockGet: mockGet // expose the mock
  };
});

// IMPORTANT: Import handler only after mocking is set up
const { __mockGet } = require('aws-sdk');
const { handler } = require('../../src/handlers/get'); 

describe('get handler unit tests', () => {
  const TABLE_NAME = 'OrdersTableTest';

  beforeEach(() => {
    process.env.ORDERS_TABLE = TABLE_NAME;
    jest.clearAllMocks();
  });

  it('should return an item if found', async () => {
    const mockItem = { id: '123', product: 'apple' };
    __mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({ Item: mockItem })
    });

    const event = { pathParameters: { orderId: '123' } };

    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(mockItem);
    expect(__mockGet).toHaveBeenCalledWith({
      TableName: TABLE_NAME,
      Key: { id: '123' }
    });
  });

  it('should return 404 if item not found', async () => {
    __mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({ Item: undefined })
    });

    const event = { pathParameters: { orderId: '456' } };

    const res = await handler(event);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).message).toBe('Order not found');
    expect(__mockGet).toHaveBeenCalledWith({
      TableName: TABLE_NAME,
      Key: { id: '456' }
    });
  });

  it('should return 400 if orderId is missing', async () => {
    const res = await handler({ pathParameters: {} });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Order ID is required');
  });

  it('should return 500 if DynamoDB throws', async () => {
    __mockGet.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('Dynamo failure'))
    });

    const event = { pathParameters: { orderId: '123' } };

    const res = await handler(event);
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('Error retrieving order');
    expect(JSON.parse(res.body).error).toBe('Dynamo failure');
  });
});
