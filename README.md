# AWS CRUD API (Serverless, Lambda, DynamoDB)

A robust, production-ready serverless CRUD API for managing customer orders, built with Node.js, AWS Lambda, API Gateway, DynamoDB, and the Serverless Framework. This project is designed to demonstrate best practices in serverless architecture, infrastructure-as-code, CI/CD automation, and automated testing. It is suitable for real-world use cases such as e-commerce order management, inventory systems, and more.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Use Case Scenario](#use-case-scenario)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Infrastructure Design](#infrastructure-design)
- [Code Design](#code-design)
- [Setup & Installation](#setup--installation)
- [Local Development](#local-development)
- [Testing](#testing)
- [CI/CD & Automation](#cicd--automation)
- [Deployment](#deployment)
- [API Endpoints & Usage](#api-endpoints--usage)
- [Cleanup](#cleanup)
- [License](#license)

---

## Project Overview
This repository contains a fully serverless CRUD API for managing customer orders. The solution leverages AWS Lambda for compute, DynamoDB for persistent storage, and API Gateway for HTTP endpoints. The Serverless Framework is used for infrastructure-as-code, making deployment and management seamless. The project is structured for scalability, maintainability, and ease of extension.

---

## Use Case Scenario
Imagine a growing online shop that needs to manage customer orders, products, and order statuses efficiently. As the business scales, traditional server management becomes a bottleneck. By adopting a serverless architecture, the shop can:
- Automatically scale to handle traffic spikes
- Reduce operational overhead and costs
- Focus on business logic instead of infrastructure
- Rapidly deploy new features and fixes

This project provides a blueprint for such a transition, with a focus on real-world business logic, validation, and best practices.

---

## Features
- **Full CRUD Operations**: Create, read, update, and delete customer orders
- **Product Catalog Initialization**: Easily populate the products table
- **Order Status Management**: Update and track order statuses
- **Robust Validation**: Input validation and error handling throughout
- **Infrastructure as Code**: All resources defined in `serverless.yml`
- **Automated Testing**: Unit and integration tests for all handlers
- **Local Development**: Emulate AWS services locally for rapid iteration
- **CI/CD Ready**: Easily integrate with GitHub Actions or other CI/CD tools

---

## Architecture Overview
- **API Gateway**: Exposes RESTful HTTP endpoints for all CRUD operations
- **AWS Lambda**: Stateless compute for each API operation (one handler per operation)
- **DynamoDB**: Two tables—one for orders, one for products
- **CloudWatch**: Centralized logging and alarms for monitoring
- **Serverless Framework**: Manages deployment, configuration, and infrastructure


![Project Infrastructure Diagram](assets/Infra%20diagram.png)
---

## Prerequisites
- **Node.js** >= 20.x
- **npm** >= 8.x
- **AWS CLI** configured with access to your AWS account
- **Serverless Framework** globally installed (`npm install -g serverless`)
- (Optional) **Docker** for running DynamoDB locally
- (Optional) **GitHub Actions** or another CI/CD tool for automated deployment



---

## Infrastructure Design
- **Orders Table**: DynamoDB table for customer orders (partition key: `id`)
- **Products Table**: DynamoDB table for product catalog (partition key: `productName`)
- **API Endpoints**: `/orders`, `/orders/{orderId}`
- **IAM Roles**: Lambda functions have least-privilege access to DynamoDB
- **CloudWatch**: Logs and alarms for observability
- **Plugins**: `serverless-offline` for local dev, `serverless-dotenv-plugin` for environment management



---

## Code Design
- **src/handlers/**: Lambda functions for each API operation
  - `create.js`: Create a new order (validates input, enriches items, calculates totals)
  - `get.js`: Retrieve an order by ID
  - `list.js`: List all orders (supports pagination)
  - `update.js`: Update order details (supports partial updates, recalculates totals)
  - `updateStatus.js`: Update only the order status
  - `delete.js`: Delete an order by ID
  - `initializeProducts.js`: Populate the products table with initial data
- **src/constants/products.js**: Defines the product catalog and utility functions
- **src/utils/**: Utility functions (e.g., timestamp formatting)
- **__tests__/**: Unit and integration tests for all handlers



---

## Setup & Installation
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aws-crud-api
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure AWS credentials**
   Ensure your AWS CLI is configured (`aws configure`).



---

## Local Development
Develop and test your API locally before deploying to AWS.

1. **Start DynamoDB Local (optional, for full local experience):**
   - Use Docker or install DynamoDB Local manually.
   - Example with Docker:
     ```bash
     docker run -p 8000:8000 amazon/dynamodb-local
     ```
2. **Start the local server:**
   ```bash
   npm run offline
   ```
   The API will be available at `http://localhost:4000`.
3. **Test endpoints locally** using Postman, curl, or your preferred tool.



---

## Testing
Automated tests ensure code quality and reliability.

- **Run all tests:**
  ```bash
  npm test
  ```
- **Run only unit tests:**
  ```bash
  npm run test:unit
  ```
- **Run only integration tests:**
  ```bash
  npm run test:integration
  ```
- **View coverage report:**
  ```bash
  npm run test:coverage
  ```

Test files are located in `__tests__/unit` and `__tests__/integration`.



---

## CI/CD & Automation
Integrate with GitHub Actions or your preferred CI/CD tool for automated deployment and testing.

- **Recommended Branch Strategy:**
  - `main`: Production
  - `dev`: Development
  - Feature branches: `feature/xyz`
- **Typical Workflow:**
  1. Push changes to `dev` for development deployments
  2. Merge to `main` for production deployments
- **GitHub Actions Example:**
  - Install dependencies
  - Run tests
  - Deploy to AWS using Serverless Framework
  - Use GitHub Secrets for AWS credentials and Serverless access key



---

## Deployment
1. **Deploy to AWS:**
   ```bash
   npm run deploy
   # or
   serverless deploy
   ```
2. **Initialize the product catalog:**
   - After deployment, run the `initializeProducts` Lambda (via AWS Console or CLI) to populate the products table.
3. **Retrieve API Gateway URL:**
   - After deployment, note the API endpoint URL output by Serverless or in the AWS Console.



---

## API Endpoints & Usage
- `POST   /orders` - Create a new order
- `GET    /orders/{orderId}` - Get order by ID
- `GET    /orders` - List all orders
- `PUT    /orders/{orderId}` - Update order details
- `PUT    /orders/{orderId}/status` - Update order status
- `DELETE /orders/{orderId}` - Delete an order

### Example Usage (with curl)
```bash
# Create an order
curl -X POST <API_URL>/orders -H 'Content-Type: application/json' -d '{"customerName":"John Doe","items":{"apple":2},"shippingAddress":"123 Main St"}'

# Get an order
curl <API_URL>/orders/<orderId>

# List orders
curl <API_URL>/orders

# Update an order
curl -X PUT <API_URL>/orders/<orderId> -H 'Content-Type: application/json' -d '{"customerName":"Jane Doe"}'

# Update order status
curl -X PUT <API_URL>/orders/<orderId>/status -H 'Content-Type: application/json' -d '{"status":"SHIPPED"}'

# Delete an order
curl -X DELETE <API_URL>/orders/<orderId>
```



---

## Cleanup
To remove all deployed resources:
```bash
npm run remove
# or
serverless remove
```



---

## License
[MIT](LICENSE)
