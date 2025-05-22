const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { generateTrackingNumber } = require('../utils/tracking');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE;

const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

module.exports.handler = async (event) => {
  try {
    const timestamp = new Date().getTime();
    const data = JSON.parse(event.body);
    const id = uuidv4();
    const trackingNumber = generateTrackingNumber();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id,
        trackingNumber,
        status: ORDER_STATUS.PENDING,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...data
      }
    };

    await dynamoDB.put(params).promise();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Order created successfully',
        orderId: id,
        trackingNumber,
        status: ORDER_STATUS.PENDING
      })
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error creating order',
        error: error.message
      })
    };
  }
}; 