// __tests__/unit/update.test.js

jest.mock('aws-sdk', () => {
  const mDocumentClient = {
    get: jest.fn(),
    update: jest.fn(),
    promise: jest.fn(),
  };
  // Support chaining .get().promise()
  mDocumentClient.get.mockReturnThis();
  mDocumentClient.update.mockReturnThis();
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mDocumentClient),
    },
  };
});

const AWS = require('aws-sdk');
const mockDocumentClientInstance = new AWS.DynamoDB.DocumentClient();
const mockGet = mockDocumentClientInstance.get;
const mockUpdate = mockDocumentClientInstance.update;

const { handler } = require('../../src/handlers/update');

beforeAll(() => {
  process.env.ORDERS_TABLE = 'OrdersTableTest';
  process.env.PRODUCTS_TABLE = 'ProductsTableTest';
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('update handler unit tests', () => {

  it('should return 400 for invalid status', async () => {
    const event = {
      pathParameters: { orderId: '123' },
      queryStringParameters: { status: 'INVALID_STATUS' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/Invalid status/);
  });

  it('should return 404 if order not found', async () => {
    // Mock no order found
    mockGet.mockImplementationOnce(() => ({
      promise: jest.fn().mockResolvedValue({}),
    }));

    const event = {
      pathParameters: { orderId: '123' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('Order not found');
  });

  it('should return 400 for invalid JSON body', async () => {
    const event = {
      pathParameters: { orderId: '123' },
      body: '{invalidJson',
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe('Invalid JSON body');
  });

  it('should update order with status and customer name', async () => {
    const orderId = 'order123';
    mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({ Item: { id: orderId } }),
    });
    mockUpdate.mockReturnValueOnce({
      promise: () => Promise.resolve({ Attributes: { id: orderId, status: 'SHIPPED', customerName: 'John' } }),
    });

    const event = {
      pathParameters: { orderId },
      queryStringParameters: { status: 'shipped' },
      body: JSON.stringify({ customerName: 'John' }),
    };

    const response = await handler(event);

    expect(mockGet).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ id: orderId, status: 'SHIPPED', customerName: 'John' });
  });

  it('should update only status', async () => {
    const orderId = 'order456';
    mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({ Item: { id: orderId } }),
    });
    mockUpdate.mockReturnValueOnce({
      promise: () => Promise.resolve({ Attributes: { id: orderId, status: 'DELIVERED' } }),
    });

    const event = {
      pathParameters: { orderId },
      queryStringParameters: { status: 'DELIVERED' },
      body: null,
    };

    const response = await handler(event);

    expect(mockGet).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe('DELIVERED');
  });


  it('should return 400 if orderId missing', async () => {
    const event = {
      pathParameters: {},
      queryStringParameters: {},
      body: JSON.stringify({ customerName: 'John' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('Order ID is required');
  });

  it('should return 500 if DynamoDB update fails', async () => {
    const orderId = 'orderFail';
    mockGet.mockReturnValueOnce({
      promise: () => Promise.resolve({ Item: { id: orderId } }),
    });

    mockUpdate.mockReturnValueOnce({
      promise: () => Promise.reject(new Error('DynamoDB update failure')),
    });

    const event = {
      pathParameters: { orderId },
      queryStringParameters: {},
      body: JSON.stringify({ customerName: 'John' }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toContain('Error updating order');
  });
});
