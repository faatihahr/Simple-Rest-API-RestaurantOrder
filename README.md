# Blog API

A simple REST API for managing blog posts built with Express.js and TypeScript. This API allows you to perform basic CRUD operations on blog posts, including retrieving all posts, creating new posts, and deleting existing posts.

## Features

- Get all blog posts
- Create new blog posts
- Delete blog posts by ID
- In-memory data storage (for demonstration purposes)

## Technologies Used

- Node.js
- Express.js
- TypeScript

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd blog
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

The API provides the following endpoints:

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### 1. Get All Posts
- **Method:** GET
- **Endpoint:** `/`
- **Description:** Retrieves all blog posts
- **Response:** Array of post objects

Example:
```bash
curl http://localhost:3000/api/v1/
```

#### 2. Create a New Post
- **Method:** POST
- **Endpoint:** `/posts`
- **Description:** Creates a new blog post
- **Request Body:**
  ```json
  {
    "title": "Post Title",
    "content": "Post content here",
    "author": "Author Name"
  }
  ```
- **Response:** The created post object

Example:
```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "author": "John Doe"
  }'
```

#### 3. Delete a Post
- **Method:** DELETE
- **Endpoint:** `/posts/:id`
- **Description:** Deletes a blog post by its ID
- **Parameters:** `id` (number) - The ID of the post to delete
- **Response:** 204 No Content on success

Example:
```bash
curl -X DELETE http://localhost:3000/api/v1/posts/1
```

## Post Model

Each post has the following structure:
```typescript
{
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- 400 Bad Request: Missing required fields or invalid parameters
- 404 Not Found: Post not found
- 204 No Content: Successful deletion

## Contributing

Feel free to submit issues and pull requests.

## License

This project is licensed under the ISC License.
