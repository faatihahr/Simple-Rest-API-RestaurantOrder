# Marketplace API

A simple REST API for managing products and orders in a marketplace, built with Express.js and TypeScript. This API allows you to perform CRUD operations on products and orders, with in-memory data storage for demonstration purposes.

## Features

- **Products Management**: Create, read, update, and delete products
- **Orders Management**: Create, read, update, and delete orders with product validation
- **Data Validation**: Automatic validation for product existence and order items
- **TypeScript Support**: Full type safety with TypeScript interfaces
- **In-memory Storage**: Simple data persistence for development/demo purposes

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework for Node.js
- **TypeScript** - Typed JavaScript for better development experience
- **tsx** - TypeScript execution and REPL

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd marketplace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`.

## Usage

The API provides endpoints for managing products and orders.

### Base URL
```
http://localhost:3000/api
```

### Products Endpoints

#### 1. Get All Products
- **Method:** GET
- **Endpoint:** `/products`
- **Description:** Retrieves all products
- **Response:** Array of product objects

Example:
```bash
curl http://localhost:3000/api/products
```

#### 2. Get Product by ID
- **Method:** GET
- **Endpoint:** `/products/:id`
- **Description:** Retrieves a specific product by ID
- **Parameters:** `id` (number) - Product ID
- **Response:** Product object or 404 if not found

Example:
```bash
curl http://localhost:3000/api/products/1
```

#### 3. Create Product
- **Method:** POST
- **Endpoint:** `/products/createprd`
- **Description:** Creates a new product
- **Request Body:**
  ```json
  {
    "name": "Product Name",
    "price": 29.99,
    "description": "Product description"
  }
  ```
- **Response:** Created product object (201 status)

Example:
```bash
curl -X POST http://localhost:3000/api/products/createprd \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "price": 19.99,
    "description": "A great new product"
  }'
```

#### 4. Update Product
- **Method:** PUT
- **Endpoint:** `/products/update/:id`
- **Description:** Updates an existing product (partial update allowed)
- **Parameters:** `id` (number) - Product ID
- **Request Body:** Any combination of name, price, description
  ```json
  {
    "price": 24.99,
    "description": "Updated description"
  }
  ```
- **Response:** Updated product object or 404 if not found

Example:
```bash
curl -X PUT http://localhost:3000/api/products/update/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 24.99}'
```

#### 5. Delete Product
- **Method:** DELETE
- **Endpoint:** `/products/:id`
- **Description:** Deletes a product by ID
- **Parameters:** `id` (number) - Product ID
- **Response:** Deleted product object or 404 if not found

Example:
```bash
curl -X DELETE http://localhost:3000/api/products/1
```

### Orders Endpoints

#### 1. Get All Orders
- **Method:** GET
- **Endpoint:** `/orders`
- **Description:** Retrieves all orders
- **Response:** Array of order objects

Example:
```bash
curl http://localhost:3000/api/orders
```

#### 2. Get Order by ID
- **Method:** GET
- **Endpoint:** `/orders/:id`
- **Description:** Retrieves a specific order by ID
- **Parameters:** `id` (number) - Order ID
- **Response:** Order object or 404 if not found

Example:
```bash
curl http://localhost:3000/api/orders/1
```

#### 3. Create Order
- **Method:** POST
- **Endpoint:** `/orders/createorders`
- **Description:** Creates a new order with product validation
- **Request Body:**
  ```json
  {
    "items": [
      {
        "productId": 1,
        "quantity": 2
      },
      {
        "productId": 2,
        "quantity": 1
      }
    ]
  }
  ```
- **Response:** Created order object with calculated total (201 status)
- **Validation:** Checks if all products exist, calculates total price

Example:
```bash
curl -X POST http://localhost:3000/api/orders/createorders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": 1, "quantity": 2}
    ]
  }'
```

#### 4. Update Order
- **Method:** PUT
- **Endpoint:** `/orders/update/:id`
- **Description:** Updates an existing order
- **Parameters:** `id` (number) - Order ID
- **Request Body:** Same as create order
  ```json
  {
    "items": [
      {
        "productId": 1,
        "quantity": 3
      }
    ]
  }
  ```
- **Response:** Updated order object or 404 if not found

Example:
```bash
curl -X PUT http://localhost:3000/api/orders/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": 1, "quantity": 3}
    ]
  }'
```

#### 5. Delete Order
- **Method:** DELETE
- **Endpoint:** `/orders/del/:id`
- **Description:** Deletes an order by ID
- **Parameters:** `id` (number) - Order ID
- **Response:** Deleted order object or 404 if not found

Example:
```bash
curl -X DELETE http://localhost:3000/api/orders/del/1
```

## Data Models

### Product Model
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}
```

### Order Models
```typescript
interface OrderItem {
  productId: number;
  quantity: number;
  name: string; // Auto-populated from product
}

interface Order {
  id: number;
  items: OrderItem[];
  total: number; // Auto-calculated
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- **200 OK**: Successful GET/PUT operations
- **201 Created**: Successful POST operations
- **204 No Content**: Successful DELETE operations
- **400 Bad Request**: Missing required fields, invalid product IDs, or empty order items
- **404 Not Found**: Resource not found

Error Response Format:
```json
{
  "message": "Error description"
}
```

## Sample Data

The API comes pre-loaded with sample data:

**Products:**
- Pizza ($10) - Delicious pizza
- Burger ($5) - Tasty burger

**Orders:**
- Order 1: 2 Pizzas, 1 Burger (Total: $25)
- Order 2: 3 Burgers (Total: $15)

## Project Structure

```
marketplace/
├── src/
│   ├── app.ts              # Main application setup
│   ├── controllers/
│   │   ├── productController.ts  # Product business logic
│   │   └── orderController.ts    # Order business logic
│   ├── models/
│   │   ├── Product.ts      # Product interfaces and data
│   │   └── Order.ts        # Order interfaces and data
│   └── routes/
│       ├── productRoutes.ts # Product API routes
│       └── orderRoutes.ts   # Order API routes
├── package.json
├── tsconfig.json
└── README.md
```

## Development

- **Build**: `npm run build` - Compiles TypeScript to JavaScript
- **Start**: `npm start` - Runs the compiled JavaScript
- **Dev**: `npm run dev` - Runs with hot reload using tsx

## Contributing

Feel free to submit issues and pull requests to improve this API.

## License

This project is licensed under the ISC License.
