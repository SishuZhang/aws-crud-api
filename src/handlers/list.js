const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

const handler = async (event) => {
  try {
    const params = {
      TableName: TABLE_NAME
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
      body: JSON.stringify(result.Items)
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