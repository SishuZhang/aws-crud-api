const { MockDocumentClient } = require('./src/utils/mockDynamoDB');

// Test the mock DynamoDB
const mockDB = new MockDocumentClient();

async function testMock() {
  try {
    console.log('Testing mock DynamoDB...');
    
    // Test scan
    const scanResult = await mockDB.scan({ TableName: 'aws-crud-api-dev-orders' }).promise();
    console.log('Scan result:', scanResult);
    
    // Test get
    const getResult = await mockDB.get({ 
      TableName: 'aws-crud-api-dev-products', 
      Key: { productName: 'apple' } 
    }).promise();
    console.log('Get result:', getResult);
    
    // Test put
    const putResult = await mockDB.put({
      TableName: 'aws-crud-api-dev-orders',
      Item: { id: 'test-123', customerName: 'Test User' }
    }).promise();
    console.log('Put result:', putResult);
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMock();
