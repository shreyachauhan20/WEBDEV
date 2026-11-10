# Inventory and Data Management System

A robust RESTful API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)** for managing product inventories, tracking stock levels, handling stock adjustments, and generating analytics reports.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [API Reference](#api-reference)
  - [1. Create Product](#1-create-product)
  - [2. Get All Products (Filter, Search, Sort & Paginate)](#2-get-all-products)
  - [3. Get Product By ID](#3-get-product-by-id)
  - [4. Update Product](#4-update-product)
  - [5. Delete Product](#5-delete-product)
  - [6. Adjust Stock Level](#6-adjust-stock-level)
  - [7. Low Stock Report](#7-low-stock-report)
  - [8. Category Inventory Summary](#8-category-inventory-summary)
- [Error Handling](#error-handling)

---

## Features

- **Full Product CRUD**: Create, read, update, and delete product records.
- **Advanced Querying**: Search by name (case-insensitive regex), filter by category, sort by custom fields, and paginate results.
- **Inventory Adjustments**: Dedicated endpoint to increment or decrement stock levels safely with validation against negative stock.
- **Low Stock Alerts**: Automatically retrieves items where current quantity has fallen to or below the configured reorder level.
- **Aggregation Analytics**: Aggregation pipeline calculating category-level totals (total items, total quantity, total inventory valuation, and average price).
- **Mongoose Schema Virtuals**: Computes `stockValue` (`price * quantity`) dynamically and provides `id` mapping.
- **Centralized Error Handling**: Standardized error responses across all routes.

---

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v16+)
- **Framework**: [Express.js](https://expressjs.com/) (v5)
- **Database / ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **CORS**: Cross-Origin Resource Sharing enabled
- **Environment Management**: [dotenv](https://github.com/motdotla/dotenv)

---

## Project Structure

```text
inventory-and-data-management-system/
├── controllers/
│   └── productscontroller.js   # Route controller logic & aggregation pipelines
├── models/
│   └── Product.js              # Mongoose schema, validation & virtual fields
├── routes/
│   └── productRoutes.js        # Express routes definitions
├── .env                        # Environment variables (port, db connection)
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Application entry point, middleware & DB connection
└── README.md                   # Project documentation
```

---

## Data Model

### Product Schema (`models/Product.js`)

| Field | Type | Required | Description / Rules |
|---|---|---|---|
| `name` | String | Yes | Product name (trimmed) |
| `sku` | String | Yes | Stock Keeping Unit (unique, trimmed) |
| `category` | String | Yes | Category classification (e.g. "Electronics", "Stationery") |
| `price` | Number | Yes | Unit price (minimum: 0) |
| `quantity` | Number | Yes | Current quantity in stock (minimum: 0) |
| `reorderLevel` | Number | Yes | Threshold quantity to trigger restocking (minimum: 0) |
| `supplier` | String | Yes | Supplier name (trimmed) |
| `createdAt` | Date | Auto | Timestamp of record creation |
| `updatedAt` | Date | Auto | Timestamp of last modification |

#### Virtual Fields
- **`stockValue`**: Calculated dynamically as `price * quantity`.
- **`id`**: Maps the internal `_id` to a string representation.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or newer)
- A running **MongoDB** instance (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

1. Open your terminal and navigate to the project directory:
   ```bash
   cd inventory-and-data-management-system
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

### Environment Configuration

Check or create a `.env` file in the root of `inventory-and-data-management-system`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/inventory_db
```

> **Note for MongoDB Atlas**: Replace `MONGO_URI` with your connection string:
> ```env
> MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/inventory_db?retryWrites=true&w=majority
> ```

### Running the Application

To start the server:

```bash
npm start
```

For development (if `nodemon` is installed globally or in your dev dependencies):
```bash
npx nodemon server.js
```

When successfully connected, you should see:
```text
Connected to MongoDB successfully
Server running on port 5000
```

---

## API Reference

Base URL: `http://localhost:5000/api/products`

### 1. Create Product
- **Method**: `POST`
- **Path**: `/api/products`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Wireless Mouse",
    "sku": "WM-1001",
    "category": "Electronics",
    "price": 24.99,
    "quantity": 150,
    "reorderLevel": 30,
    "supplier": "Logitech Direct"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "_id": "6730ef61b9e248b111a43a01",
    "name": "Wireless Mouse",
    "sku": "WM-1001",
    "category": "Electronics",
    "price": 24.99,
    "quantity": 150,
    "reorderLevel": 30,
    "supplier": "Logitech Direct",
    "stockValue": 3748.5,
    "id": "6730ef61b9e248b111a43a01",
    "createdAt": "2026-11-10T20:00:00.000Z",
    "updatedAt": "2026-11-10T20:00:00.000Z"
  }
  ```

---

### 2. Get All Products
Supports filtering, searching, sorting, and pagination.

- **Method**: `GET`
- **Path**: `/api/products`
- **Query Parameters**:
  - `category`: Filter by category (e.g. `?category=Electronics`)
  - `search`: Case-insensitive partial text search on name (e.g. `?search=mouse`)
  - `sort`: Sort fields comma-separated (e.g. `?sort=price` or `?sort=-price,quantity`)
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
- **Example Request**:
  ```text
  GET /api/products?category=Electronics&sort=-price&page=1&limit=5
  ```
- **Response**: `200 OK`
  ```json
  {
    "total": 24,
    "page": 1,
    "totalPages": 5,
    "count": 5,
    "products": [ ... ]
  }
  ```

---

### 3. Get Product By ID
- **Method**: `GET`
- **Path**: `/api/products/:id`
- **Response**: `200 OK` (or `404 Not Found` if the ID doesn't exist)

---

### 4. Update Product
- **Method**: `PUT`
- **Path**: `/api/products/:id`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "price": 21.99,
    "reorderLevel": 25
  }
  ```
- **Response**: `200 OK` (returns updated product with schema validations applied)

---

### 5. Delete Product
- **Method**: `DELETE`
- **Path**: `/api/products/:id`
- **Response**: `200 OK`
  ```json
  {
    "message": "Product deleted",
    "id": "6730ef61b9e248b111a43a01"
  }
  ```

---

### 6. Adjust Stock Level
Increments or decrements stock safely. Returns an error if the resulting quantity would be negative.

- **Method**: `PATCH`
- **Path**: `/api/products/:id/stock`
- **Headers**: `Content-Type: application/json`
- **Request Body (Adding stock)**:
  ```json
  {
    "change": 20
  }
  ```
- **Request Body (Reducing stock)**:
  ```json
  {
    "change": -5
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Stock updated",
    "product": {
      "_id": "6730ef61b9e248b111a43a01",
      "name": "Wireless Mouse",
      "quantity": 165,
      "stockValue": 4123.35,
      ...
    }
  }
  ```
- **Insufficient Stock Error Response**: `400 Bad Request`
  ```json
  {
    "message": "Insufficient stock available"
  }
  ```

---

### 7. Low Stock Report
Fetches all products where `quantity <= reorderLevel`.

- **Method**: `GET`
- **Path**: `/api/products/low-stock`
- **Response**: `200 OK`
  ```json
  {
    "lowStockItems": {
      "count": 2,
      "items": [
        {
          "_id": "6730ef61b9e248b111a43a02",
          "name": "USB-C Cable",
          "quantity": 8,
          "reorderLevel": 15,
          ...
        }
      ]
    }
  }
  ```

---

### 8. Category Inventory Summary
Uses a MongoDB aggregation pipeline to compute inventory metrics grouped by category.

- **Method**: `GET`
- **Path**: `/api/products/summary`
- **Response**: `200 OK`
  ```json
  {
    "categories": 2,
    "summary": [
      {
        "_id": "Electronics",
        "totalItems": 12,
        "totalQuantity": 450,
        "totalStockValue": 18500.5,
        "avgPrice": 41.11
      },
      {
        "_id": "Stationery",
        "totalItems": 5,
        "totalQuantity": 800,
        "totalStockValue": 2400.0,
        "avgPrice": 3.0
      }
    ]
  }
```
Standard HTTP status codes are returned:
- `200 OK` / `201 Created` - Success
- `400 Bad Request` - Validation failures, negative quantities
- `404 Not Found` - Product not found
- `500 Internal Server Error` - Unhandled server exceptions

