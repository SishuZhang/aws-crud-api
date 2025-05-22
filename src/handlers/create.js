const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE + '-' + process.env.NODE_ENV;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const trackingNumber = uuidv4();
    const item = {
      id: trackingNumber,
      ...body,
      createdAt: new Date().toISOString()
    };

    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ trackingNumber, ...item })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create the order.' })
    };
  }
}; 