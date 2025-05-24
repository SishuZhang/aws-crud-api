// __tests__/unit/updateStatus.test.js

jest.mock('aws-sdk', () => {
  const mDocumentClient = {
    update: jest.fn(),
    promise: jest.fn(),
  };
  mDocumentClient.update.mockReturnThis();
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mDocumentClient),
    },
  };
});

const AWS = require('aws-sdk');
const mockUpdate = new AWS.DynamoDB.DocumentClient().update;

const { handler } = require('../../src/handlers/updateStatus');

beforeAll(() => {
  process.env.ORDERS_TABLE = 'OrdersTableTest';
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateStatus handler unit tests', () => {
  it('should update order status successfully', async () => {
    const event = {
      pathParameters: { id: 'order123' },
      body: JSON.stringify({ status: 'SHIPPED' }),
    };

    const fakeResponse = {
      Attributes: {
        id: 'order123',
        status: 'SHIPPED',
        updatedAt: 1234567890,
      },
    };

    mockUpdate.mockImplementation(() => ({
      promise: jest.fn().mockResolvedValue(fakeResponse),
    }));

    const response = await handler(event);

    expect(mockUpdate).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Item status updated successfully.');
    expect(body.order).toEqual(fakeResponse.Attributes);
  });

  it('should return 400 if status is missing', async () => {
    const event = {
      pathParameters: { id: 'order123' },
      body: JSON.stringify({}),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Missing status in request body.');
    expect(body.validStatuses).toEqual([
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]);
  });

  it('should return 400 for invalid status', async () => {
    const event = {
      pathParameters: { id: 'order123' },
      body: JSON.stringify({ status: 'INVALID' }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Invalid status');
    expect(body.validStatuses).toEqual([
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]);
  });

  it('should return 400 for invalid JSON body', async () => {
    const event = {
      pathParameters: { id: 'order123' },
      body: '{invalidJson',
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Invalid JSON in request body.');
  });

  it('should return 404 if ConditionalCheckFailedException error thrown', async () => {
    const event = {
      pathParameters: { id: 'order123' },
      body: JSON.stringify({ status: 'SHIPPED' }),
    };

    const error = new Error('ConditionalCheckFailedException error');
    error.code = 'ConditionalCheckFailedException';

    mockUpdate.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(error),
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Item not found or status already updated.');
  });

  it('should return 500 for other errors', async () => {
    const event = {
      pathParameters: { id: 'order123' },
      body: JSON.stringify({ status: 'SHIPPED' }),
    };

    const error = new Error('Some other error');

    mockUpdate.mockImplementation(() => ({
      promise: jest.fn().mockRejectedValue(error),
    }));

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error updating order status');
    expect(body.error).toBe('Some other error');
  });
});
