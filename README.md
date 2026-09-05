# DineGraph API

A production-oriented backend built with **Node.js**, **Express.js**, **GraphQL Yoga**, and **TypeScript**, specifically architected to interact with **PostgreSQL (Supabase)**.

## Current Version

This version provides a read-focused restaurant, city, menu, and analytics API with protected administrator mutations. It includes:

- PostgreSQL access through parameterized SQL repositories.
- Service classes for business rules and validation.
- Request-scoped DataLoaders for restaurant, menu, city, and country relationships.
- JWT and API-key authentication for administrator writes.
- Production checks for JWT secrets, CORS, and remote database TLS.
- Strict pagination limits: `limit` must be between `1` and `100`, and `offset` cannot be negative.
- Structured errors with safe GraphQL error codes.
- Health and readiness endpoints.
- Focused automated tests for authorization and pagination.

---

## 🏛️ Architecture & Clean Code Design

```
src/
├── config/             # Zod-validated environment config & Pino structured logger
├── database/           # pg.Pool with SSL, Transaction helper & health checks
│   ├── pool.ts
│   └── schema.sql      # Supabase DDL schema with indexes and constraints
├── errors/             # Standardized AppError and GraphQL error handling
├── types/              # Domain models, database entities, context interfaces
├── repositories/       # Data access layer (Raw SQL with parameterized queries)
│   ├── base.repository.ts
│   ├── restaurant.repository.ts
│   ├── city.repository.ts
│   ├── country.repository.ts
│   ├── menu.repository.ts
│   ├── feature.repository.ts
│   ├── delivery.repository.ts
│   ├── cuisine.repository.ts
│   └── analytics.repository.ts # CTEs, Window Functions, and SQL Aggregations
├── dataloaders/        # DataLoader batching to eliminate the N+1 query problem
├── services/           # Business logic and validation layer
├── graphql/            # GraphQL Schema (typeDefs, modular resolvers, scalar types)
│   ├── typeDefs.ts
│   ├── schema.ts
│   └── resolvers/
├── middleware/         # Security (Helmet, CORS, Rate Limiting, JWT Auth, Request IDs)
│   ├── auth.ts          # JWT/API-key extraction
│   └── authorization.ts # Reusable authentication and role guards
├── routes/             # REST probes (/health, /ready)
├── app.ts              # Express application factory with DI
└── server.ts           # Server bootstrap with graceful shutdown

test/                    # Node test runner tests
migrations/              # SQL migration workflow guidance
```

---

## 🚀 Quick Start Guide

### 1. Configure Environment Variables

Open the `.env` file in the root directory and set your Supabase database connection URL:

```env
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
# Use an explicit frontend origin in production; do not use * with credentials.
CORS_ORIGIN=http://localhost:3000

# Replace with your Supabase connection string:
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require

DB_POOL_MIN=2
DB_POOL_MAX=20
DB_TIMEOUT_MS=10000
DB_IDLE_TIMEOUT_MS=30000

JWT_SECRET=your-secret-key-at-least-32-characters
API_KEY=optional-admin-key
LOG_LEVEL=info
```

Production requires a JWT secret of at least 32 characters and an explicit `CORS_ORIGIN`. Remote PostgreSQL connections use certificate verification. Keep API keys and database credentials outside source control.

> **Supabase Tip**: You can get your connection string directly from **Supabase Dashboard** -> **Project Settings** -> **Database** -> **Connection String (URI)**. Using port `6543` (Transaction Pooler) is recommended.

### 2. Run the Development Server

```bash
npm run dev
```

The server will start with hot-reloading at:

- **Interactive GraphiQL Playground**: [http://localhost:4000/graphql](http://localhost:4000/graphql)
- **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **Database Readiness & Latency Probe**: [http://localhost:4000/ready](http://localhost:4000/ready)

### 3. Production Build

```bash
npm run build
npm start
```

### 4. Typecheck and Tests

```bash
npm run typecheck
npm test
```

The test suite currently covers anonymous mutation rejection, administrator role checks, and pagination boundaries.

### 5. Database Schema and Migrations

The reference schema is [src/database/schema.sql](src/database/schema.sql). Migration guidance is in [migrations/README.md](migrations/README.md). Apply numbered SQL migrations in order and never modify a migration after it has been applied to a shared database.

### 6. Local PostgreSQL with Docker

```bash
docker compose up -d postgres
```

For the local container, use `postgresql://dinegraph:dinegraph-local-only@localhost:5432/dinegraph` as `DATABASE_URL`. The API itself can run with `npm run dev` on the host or from the included production `Dockerfile`.

---

## 🔮 GraphQL Query Examples to Learn PostgreSQL

Open [http://localhost:4000/graphql](http://localhost:4000/graphql) in your browser and try running these queries:

### 1. Nested Relational Query (Resolved via DataLoaders)

Fetches restaurants along with their menus, nutrition facts, features, delivery metrics, and city details in batched SQL queries:

```graphql
query GetRestaurantsWithFullDetails {
  restaurants(pagination: { limit: 5, offset: 0 }) {
    totalCount
    hasMore
    items {
      restaurant_id
      restaurant_name
      cuisine
      average_rating
      price_level
      city
      country
      features {
        wifi
        outdoor_seating
        hours_24
        pet_friendly
        alcohol
      }
      deliveryMetrics {
        delivery_fee
        estimated_delivery_time
        availability
      }
      menus {
        item_name
        price
        food_category
        vegetarian
        vegan
        nutrition {
          calories
          protein
          fat
          carbohydrates
        }
        priceHistory {
          current_price
          previous_price
          price_change
          timestamp
        }
      }
    }
  }
}
```

---

### 2. Filtered Search with Pagination

Search for high-rated restaurants offering delivery in a specific city:

```graphql
query SearchRestaurants {
  restaurants(
    filter: { search: "Pizza", minRating: 4.0, deliveryAvailable: true }
    pagination: { limit: 10, offset: 0 }
  ) {
    totalCount
    items {
      restaurant_name
      cuisine
      city
      average_rating
      review_count
      delivery_available
    }
  }
}
```

---

### 3. Advanced PostgreSQL Analytics (Window Functions & CTEs)

#### A. Cuisine Market Distribution (`GROUP BY`, `HAVING`, `AVG`):

```graphql
query GetCuisineMarketShare {
  cuisineMarketShare(minRestaurants: 2) {
    cuisine
    restaurantCount
    averageRating
    averagePriceLevel
  }
}
```

#### B. City Dining Aggregations (Multi-table CTEs & Aggregations):

```graphql
query GetCityOverview {
  cityDiningOverview {
    city
    country
    totalRestaurants
    avgRating
    avgMenuPrice
    avgDeliveryTime
    fastestDeliveryTime
  }
}
```

#### C. Top Dishes by Category (Window Function `DENSE_RANK() OVER (PARTITION BY ...)`):

```graphql
query GetTopDishes {
  topDishesPerCategory(limitPerCategory: 2) {
    foodCategory
    itemName
    price
    restaurantName
    restaurantRating
    city
  }
}
```

---

### 4. CRUD Mutations

Write mutations require an administrator credential. Send either:

- `Authorization: Bearer <JWT>` with a valid `sub` or `userId` claim and `role: "admin"`.
- `X-API-Key: <API_KEY>` when the configured API key is used.

Anonymous users and regular authenticated users receive `UNAUTHENTICATED` or `FORBIDDEN` GraphQL errors for write operations.

#### Create a Restaurant:

```graphql
mutation CreateNewRestaurant {
  createRestaurant(
    input: {
      restaurant_id: "rest_custom_001"
      restaurant_name: "The Gourmet Bistro"
      cuisine: "Italian"
      city: "New York"
      country: "United States"
      price_level: 3
      delivery_available: true
      dine_in: true
      takeaway: true
      business_status: "OPERATIONAL"
    }
  ) {
    restaurant_id
    restaurant_name
    cuisine
    city
  }
}
```

#### Add a Menu Item:

```graphql
mutation AddMenuItem {
  createMenuItem(
    input: {
      restaurant_id: "rest_custom_001"
      item_name: "Truffle Tagliatelle"
      price: 24.50
      food_category: "Pasta"
      calories: 650
      vegetarian: true
      gluten_free: false
    }
  ) {
    menu_id
    item_name
    price
    food_category
    vegetarian
  }
}
```

---

## 🛡️ Production Best Practices Implemented

1. **Eliminating the N+1 Query Problem**: Integrated request-scoped `DataLoader` instances in relational resolvers, including country cities and city restaurants.
2. **SQL Injection Defense**: 100% of queries use parameterized bindings (`$1`, `$2`).
3. **Identifier Safety**: Quoted identifier handling for columns starting with numbers (such as `"24_hours"`).
4. **Resilient Connection Pool**: Configured with timeouts, idle eviction, verified TLS for remote PostgreSQL, and graceful connection draining.
5. **Observability**: Pino structured logger with execution duration logging for database queries and request correlation tracking (`X-Request-ID`).
6. **Security Hardened**: Helmet security headers, CORS origin restriction, Express rate limiting on `/graphql`, validated request IDs, restricted JWT algorithms, and admin-only mutations.

## Known Scope

GraphQL depth and field-count limits are enabled, but full PostgreSQL integration tests are not included yet. The current tests are fast unit-level checks; run integration tests against a dedicated PostgreSQL database before production deployment. CI runs typecheck, tests, build, and high-severity dependency auditing.

with Love JAY ❤️
