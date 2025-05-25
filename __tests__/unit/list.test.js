const AWS = require('aws-sdk');
// Mock process.env before requiring the handler
const mockOrdersTable = 'OrdersTableTest';
process.env.ORDERS_TABLE = mockOrdersTable;

jest.mock('aws-sdk');

const mockScan = jest.fn();

AWS.DynamoDB.DocumentClient.mockImplementation(() => ({
  scan: mockScan
}));

const { handler } = require('../../src/handlers/list');

describe('list handler unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScan.mockReset();
  });

  test('should return a list of items', async () => {
    const mockItems = [
      { id: '1', data: 'item 1' },
      { id: '2', data: 'item 2' }
    ];
    mockScan.mockImplementationOnce(({ TableName }) => ({
      promise: async () => {
        if (TableName === mockOrdersTable) {
          return { Items: mockItems };
        }
        return { Items: [] }; // Return empty array for unexpected table
      },
    }));

    const event = {}; // List handler might not need specific event data

    const response = await handler(event);

    expect(mockScan).toHaveBeenCalledWith({
      TableName: mockOrdersTable
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockItems);
  });

  test('should return an empty array if no items found', async () => {
    mockScan.mockImplementationOnce(() => ({
      promise: async () => ({ Items: [] }) // No items found
    }));

    const event = {};

    const response = await handler(event);

    expect(mockScan).toHaveBeenCalledWith({
      TableName: mockOrdersTable
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
  });
}); 