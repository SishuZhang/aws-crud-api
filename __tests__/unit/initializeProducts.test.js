// Set environment variable before handler import
process.env.PRODUCTS_TABLE = 'ProductsTestTable';

const mockSend = jest.fn();

// Define mock products
const mockProducts = {
  product1: { id: 'p1', name: 'Product 1', price: 10 },
  product2: { id: 'p2', name: 'Product 2', price: 20 },
};
const mockProductsArray = Object.values(mockProducts);

// Mock constants
jest.mock('../../src/constants/products', () => ({
  PRODUCTS: {
    product1: { id: 'p1', name: 'Product 1', price: 10 },
    product2: { id: 'p2', name: 'Product 2', price: 20 },
  },
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend,
    })),
  },
  PutCommand: jest.fn((params) => ({ commandParams: params })),
}));

// Import AFTER mocks
const { handler } = require('../../src/handlers/initializeProducts');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

describe('initializeProducts handler unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should put all products into the database', async () => {
    mockSend.mockResolvedValue({});

    await handler({});

    expect(mockSend).toHaveBeenCalledTimes(mockProductsArray.length);

    mockProductsArray.forEach((product, index) => {
      expect(PutCommand).toHaveBeenNthCalledWith(index + 1, {
        TableName: 'ProductsTestTable',
        Item: {
          productName: product.name,
          id: product.id,
          price: product.price,
        },
      });
    });
  });

  test('should return 500 if PRODUCTS_TABLE is not set', async () => {
    delete process.env.PRODUCTS_TABLE;

    const response = await handler({});

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe(
      'PRODUCTS_TABLE environment variable not set.'
    );
  });

  test('should return 500 on DynamoDB error', async () => {
    process.env.PRODUCTS_TABLE = 'ProductsTestTable';
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const response = await handler({});

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe(
      'Failed to initialize products.'
    );
    expect(JSON.parse(response.body).error).toBe('DynamoDB error');
  });
});
