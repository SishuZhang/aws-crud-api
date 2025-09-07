const AWS = require('aws-sdk');
const { MockDocumentClient, mockDynamoDB } = require('../utils/mockDynamoDB');

// Use mock DynamoDB for local development
const dynamoDB = process.env.NODE_ENV === 'dev' ? new MockDocumentClient() : new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE;

const handler = async (event) => {
  try {
    console.log('List orders handler called');
    console.log('ORDERS_TABLE:', ORDERS_TABLE);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // For local development, return empty array if table doesn't exist
    if (!ORDERS_TABLE) {
      console.log('No ORDERS_TABLE environment variable set');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify([])
      };
    }

    const params = {
      TableName: ORDERS_TABLE
    };

    // Handle pagination if limit is provided
    if (event.queryStringParameters && event.queryStringParameters.limit) {
      params.Limit = parseInt(event.queryStringParameters.limit, 10);
    }

    console.log('Scanning DynamoDB with params:', params);
    console.log('Mock DB data before scan:', mockDynamoDB.getAllData());
    const result = await dynamoDB.scan(params).promise();
    console.log('DynamoDB scan result:', result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error retrieving orders:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error retrieving orders',
        error: error.message
      })
    };
  }
};

module.exports = { handler }; 