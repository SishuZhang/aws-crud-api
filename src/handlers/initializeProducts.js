const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PRODUCTS } = require('../constants/products');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const productsTable = process.env.PRODUCTS_TABLE;

  if (!productsTable) {
    console.error("PRODUCTS_TABLE environment variable not set.");
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'PRODUCTS_TABLE environment variable not set.',
      }),
    };
  }

  try {
    const productList = Object.values(PRODUCTS); // Get array of product objects

    const putPromises = productList.map(async (product) => {
      const params = {
        TableName: productsTable,
        Item: {
          productName: product.name, // Use name as partition key as per table definition
          id: product.id,
          price: product.price,
        },
      };
      console.log('Putting product:', params.Item);
      await ddbDocClient.send(new PutCommand(params));
    });

    await Promise.all(putPromises);

    console.log(`Successfully initialized ${productList.length} products in ${productsTable}.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully initialized ${productList.length} products.`,
      }),
    };
  } catch (error) {
    console.error("Error initializing products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to initialize products.',
        error: error.message,
      }),
    };
  }
}; 