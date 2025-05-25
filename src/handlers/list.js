const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE;

const handler = async (event) => {
  try {
    const params = {
      TableName: ORDERS_TABLE
    };

    // Handle pagination if limit is provided
    if (event.queryStringParameters && event.queryStringParameters.limit) {
      params.Limit = parseInt(event.queryStringParameters.limit, 10);
    }

    const result = await dynamoDB.scan(params).promise();

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