# Marketplace API

A comprehensive REST API for managing a marketplace system, built with Express.js, TypeScript, and Prisma ORM. This API supports user authentication, product management, order processing, inventory tracking, and more, with PostgreSQL as the database backend.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control (admin/user)
- **User Management**: Registration, login, profile management, and points system
- **Product Management**: CRUD operations on products with categories, images, favorites, and reviews
- **Order Management**: Create and manage orders with automatic stock deduction and point awarding
- **Inventory Management**: Supplier and stock tracking with automatic product availability updates
- **Table Management**: Support for restaurant-style table-based ordering
- **Point System**: Automatic point awarding for user orders (Math.floor(totalPrice / 2))
- **Data Validation**: Comprehensive validation for all operations
- **TypeScript Support**: Full type safety with TypeScript interfaces
- **Prisma ORM**: Database management with migrations and seeding

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework for Node.js
- **TypeScript** - Typed JavaScript for better development experience
- **Prisma** - Next-generation ORM for TypeScript & Node.js
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
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

3. Set up the database:
   - Create a PostgreSQL database
   - Copy `.env.example` to `.env` and configure your database URL:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/marketplace"
     JWT_SECRET="your-secret-key-here"
     ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`.

## Usage

The API provides endpoints for managing users, products, orders, suppliers, and stocks.

### Base URL
```
http://localhost:3000/api
```

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Register User
- **Method:** POST
- **Endpoint:** `/users/register`
- **Description:** Register a new user account
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "Password123!",
    "role": "user"
  }
  ```
- **Response:** User data with JWT token

#### Login User
- **Method:** POST
- **Endpoint:** `/users/login`
- **Description:** Authenticate user and get JWT token
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "Password123!"
  }
  ```
- **Response:** User data with JWT token

### User Endpoints

#### Get Users
- **Method:** GET
- **Endpoint:** `/users/`
- **Description:** Get all users (admin only)
- **Query Parameters:** `email`, `limit`

#### Transfer Points
- **Method:** POST
- **Endpoint:** `/users/transfer-points`
- **Description:** Transfer points between users
- **Request Body:**
  ```json
  {
    "senderId": 1,
    "receiverId": 2,
    "points": 10
  }
  ```

### Product Endpoints

#### Get All Products
- **Method:** GET
- **Endpoint:** `/products`
- **Description:** Retrieves all products
- **Query Parameters:** `category`, `sort`, `limit`, `offset`
- **Response:** Array of product objects with category, images, favorites, reviews

#### Get Products by Category
- **Method:** GET
- **Endpoint:** `/products/category/:categoryName`
- **Description:** Get products by category (food/beverages)
- **Parameters:** `categoryName` (food or beverages)

#### Get Product by ID
- **Method:** GET
- **Endpoint:** `/products/:id`
- **Description:** Retrieves a specific product by ID

#### Create Product (Admin Only)
- **Method:** POST
- **Endpoint:** `/products/createprd`
- **Request Body:**
  ```json
  {
    "name": "Margherita Pizza",
    "price": 12.99,
    "description": "Classic pizza with tomato sauce, mozzarella, and basil",
    "categoryId": 1
  }
  ```

#### Update Product (Admin Only)
- **Method:** PUT
- **Endpoint:** `/products/update/:id`
- **Request Body:** Any combination of name, price, description, categoryId

#### Delete Product (Admin Only)
- **Method:** DELETE
- **Endpoint:** `/products/:id`

### Order Endpoints

#### Get All Orders
- **Method:** GET
- **Endpoint:** `/orders`
- **Description:** Retrieves all orders
- **Query Parameters:** `sort`, `limit`, `offset`
- **Response:** Array of order objects with items, user, table

#### Get Order Summary
- **Method:** GET
- **Endpoint:** `/orders/summary`
- **Description:** Get daily order summary with revenue
- **Query Parameters:** `limit`, `offset`

#### Get Order by ID
- **Method:** GET
- **Endpoint:** `/orders/:id`
- **Description:** Retrieves a specific order by ID

#### Create Order
- **Method:** POST
- **Endpoint:** `/orders/createorders`
- **Description:** Creates a new order with stock validation and point awarding
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
    ],
    "tableId": 1
  }
  ```
- **Notes:** Points are automatically awarded to logged-in users (Math.floor(totalPrice / 2))

#### Update Order
- **Method:** PUT
- **Endpoint:** `/orders/update/:id`
- **Request Body:** Same as create order

#### Delete Order (Admin Only)
- **Method:** DELETE
- **Endpoint:** `/orders/del/:id`

### Supplier Endpoints

#### Get All Suppliers
- **Method:** GET
- **Endpoint:** `/suppliers`
- **Description:** Get all suppliers with their stocks

#### Get All Stocks
- **Method:** GET
- **Endpoint:** `/suppliers/get/stocks`
- **Description:** Get all stocks with supplier information

#### Create Supplier (Admin Only)
- **Method:** POST
- **Endpoint:** `/suppliers/create`
- **Request Body:**
  ```json
  {
    "name": "Acme Supplies",
    "stocks": [
      {
        "name": "Flour",
        "quantity": 100,
        "unit": "kg"
      }
    ]
  }
  ```

#### Create Stock (Admin Only)
- **Method:** POST
- **Endpoint:** `/suppliers/create/stocks`
- **Request Body:**
  ```json
  {
    "name": "Tomato",
    "quantity": 200,
    "unit": "kg",
    "supplierId": 1
  }
  ```

#### Update Stock (Admin Only)
- **Method:** POST
- **Endpoint:** `/suppliers/stock`
- **Request Body:**
  ```json
  {
    "updates": [
      {
        "stockId": 1,
        "quantityChange": 50
      }
    ]
  }
  ```

#### Delete Stock (Admin Only)
- **Method:** DELETE
- **Endpoint:** `/suppliers/delete`
- **Request Body:**
  ```json
  {
    "stockUpdates": [
      {
        "stockId": 1,
        "quantityToDelete": 25
      }
    ]
  }
  ```

## Data Models

### User Model
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string; // Hashed
  role: 'admin' | 'user' | 'supplier';
  point: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Model
```typescript
interface Product {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  images: Image[];
  favorites: UserFavorite[];
  reviews: UserReview[];
  stocks: ProductStock[];
  isAvailable: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Models
```typescript
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  id: number;
  items: OrderItem[];
  totalPrice: number;
  userId?: number;
  tableId?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category Model
```typescript
interface Category {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Supplier and Stock Models
```typescript
interface Supplier {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Stock {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  supplierId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- **200 OK**: Successful GET/PUT operations
- **201 Created**: Successful POST operations
- **204 No Content**: Successful DELETE operations
- **400 Bad Request**: Missing required fields, invalid data, insufficient stock
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server errors

Error Response Format:
```json
{
  "message": "Error description"
}
```

## Sample Data

The API comes pre-seeded with sample data:

**Users:**
- Admin: john.doe@example.com / Password123!
- User: jane.smith@example.com / Password456!

**Categories:**
- Food
- Beverages

**Products:**
- Margherita Pizza ($12.99) - Food
- Cheeseburger ($9.99) - Food
- Espresso ($3.50) - Beverages
- Orange Juice ($4.00) - Beverages

**Tables:**
- Table 1, Table 2

**Suppliers & Stocks:**
- Acme Supplies: Flour (100kg)
- Fresh Farm: Tomato (200kg)

## Project Structure

```
marketplace/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Database seeding script
│   └── migrations/        # Database migrations
├── src/
│   ├── app.ts             # Main application setup
│   ├── controllers/
│   │   ├── authController.ts     # Authentication logic
│   │   ├── userController.ts     # User management
│   │   ├── productController.ts  # Product CRUD
│   │   ├── orderController.ts    # Order management
│   │   └── supplierController.ts # Supplier & stock management
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client instance
│   │   └── validation.ts  # Validation utilities
│   ├── middleware/
│   │   ├── auth-middleware.ts        # Authentication middleware
│   │   └── handlingerror-middleware.ts # Error handling
│   ├── models/
│   │   ├── Order.ts       # Order-related interfaces
│   │   └── Product.ts     # Product-related interfaces
│   └── routes/
│       ├── userRoutes.ts      # User API routes
│       ├── productRoutes.ts   # Product API routes
│       ├── orderRoutes.ts     # Order API routes
│       └── supplierRoutes.ts  # Supplier API routes
├── package.json
├── tsconfig.json
└── README.md
```

## Development

- **Build**: `npm run build` - Compiles TypeScript to JavaScript
- **Start**: `npm start` - Runs the compiled JavaScript
- **Dev**: `npm run dev` - Runs with hot reload using tsx
- **Database**: `npx prisma studio` - Opens Prisma Studio for database management

## Environment Variables

Create a `.env` file in the root directory:

```
DATABASE_URL="postgresql://username:password@localhost:5432/marketplace"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is licensed under the ISC License.
