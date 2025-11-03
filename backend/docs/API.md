# BlackBow Associates - API Documentation

**Base URL:** `https://api.blackbowassociates.com`
**Version:** 1.5.0
**Last Updated:** November 1, 2025

---

## Table of Contents

- [Authentication](#authentication)
- [Leads API](#leads-api)
- [Users API](#users-api)
- [Payments API](#payments-api)
- [Pipedrive API (Admin)](#pipedrive-api-admin)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

**Obtaining a Token:**
Users authenticate via frontend Supabase Auth (OAuth or email/password). The JWT token is returned by Supabase and used for all API requests.

**Token Expiration:**
- Access tokens: 1 hour
- Refresh tokens: 7 days

---

## Leads API

### Get All Leads (Marketplace)

Get all available leads with optional filtering.

**Endpoint:** `GET /api/leads`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| favoritesOnly | boolean | No | Filter to show only user's favorited leads |
| search | string | No | Search by location, city, or state |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "NY123456",
      "weddingDate": "2026-09-15",
      "city": "New York",
      "state": "NY",
      "location": "New York, NY",
      "description": "Photography + Videography",
      "ethnicReligious": "Indian Wedding",
      "price": 20.00,
      "status": "AVAILABLE",
      "active": true,
      "isFavorited": false,
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Contact information (firstName, lastName, email, phone) is **hidden** until purchase
- `isFavorited` flag indicates if current user has favorited this lead
- Only `AVAILABLE` leads are returned (not `SOLD`)

---

### Get Lead Details

Get detailed information about a specific lead.

**Endpoint:** `GET /api/leads/:id`

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Lead ID (8 characters, e.g., NY123456) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "NY123456",
    "weddingDate": "2026-09-15",
    "city": "New York",
    "state": "NY",
    "location": "New York, NY",
    "description": "Photography + Videography",
    "ethnicReligious": "Indian Wedding",
    "price": 20.00,
    "status": "AVAILABLE",
    "active": true,
    "isPurchased": false,
    "isFavorited": false,
    "createdAt": "2025-11-01T10:00:00.000Z"
  }
}
```

**Notes:**
- If user has purchased this lead, contact info will be included
- `isPurchased` flag indicates if current user owns this lead

---

### Add Lead to Favorites

Add a lead to the user's favorites list.

**Endpoint:** `POST /api/leads/:leadId/favorite`

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (8 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Lead added to favorites",
  "data": {
    "userId": "user_123",
    "leadId": "NY123456",
    "createdAt": "2025-11-01T12:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Invalid lead ID
- `404`: Lead not found
- `409`: Already favorited

---

### Remove Lead from Favorites

Remove a lead from the user's favorites list.

**Endpoint:** `DELETE /api/leads/:leadId/favorite`

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (8 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Lead removed from favorites"
}
```

**Errors:**
- `400`: Invalid lead ID
- `404`: Favorite not found

---

### Get User's Favorites

Get all leads favorited by the current user.

**Endpoint:** `GET /api/leads/favorites/list`

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "NY123456",
      "weddingDate": "2026-09-15",
      "location": "New York, NY",
      "price": 20.00,
      "isFavorited": true,
      "favoritedAt": "2025-11-01T12:00:00.000Z"
    }
  ]
}
```

---

### Get Purchased Leads

Get all leads purchased by the current user.

**Endpoint:** `GET /api/leads/purchased`

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "NY123456",
      "weddingDate": "2026-09-15",
      "location": "New York, NY",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "price": 20.00,
      "purchasedAt": "2025-11-01T10:00:00.000Z",
      "hasFeedback": false
    }
  ]
}
```

**Notes:**
- Contact information (firstName, lastName, email, phone) is **visible** for purchased leads
- `hasFeedback` indicates if user has already submitted feedback for this lead
- Leads are sorted by `purchasedAt` descending (most recent first)

---

### Submit Lead Feedback

Submit feedback for a purchased lead and earn $2 reward.

**Endpoint:** `POST /api/leads/:leadId/feedback`

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (8 characters) |

**Request Body:**

```json
{
  "booked": true,
  "leadResponsive": "responsive",
  "timeToBook": 7,
  "amountCharged": 2500.00
}
```

**Fields:**

| Field | Type | Required | Description | Allowed Values |
|-------|------|----------|-------------|----------------|
| booked | boolean | Yes | Did the lead book your services? | true, false |
| leadResponsive | string | Yes | How responsive was the lead? | "responsive", "ghosted", "partial" |
| timeToBook | integer | No | Days taken to book (if booked) | 1-365 |
| amountCharged | decimal | No | Amount charged (if booked) | 0.00-999999.99 |

**Response:**

```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "reward": 2.00,
  "data": {
    "id": "feedback_123",
    "userId": "user_123",
    "leadId": "NY123456",
    "booked": true,
    "leadResponsive": "responsive",
    "timeToBook": 7,
    "amountCharged": 2500.00,
    "createdAt": "2025-11-01T14:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Invalid request body (missing required fields)
- `403`: User has not purchased this lead
- `409`: Feedback already submitted for this lead

**Notes:**
- $2.00 reward is automatically added to user's account balance
- Feedback can only be submitted once per lead per user
- Use `hasFeedback` flag from `/api/leads/purchased` to prevent duplicate submissions

---

## Users API

### Get User Profile

Get the current user's profile information.

**Endpoint:** `GET /api/users/profile`

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "balance": 100.00,
    "billingAddressLine1": "123 Main St",
    "billingAddressLine2": "Apt 4B",
    "billingCity": "New York",
    "billingState": "NY",
    "billingZip": "10001",
    "createdAt": "2025-10-01T10:00:00.000Z",
    "updatedAt": "2025-11-01T12:00:00.000Z"
  }
}
```

---

### Update Billing Address

Update the user's billing address.

**Endpoint:** `PUT /api/users/billing-address`

**Authentication:** Required

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "addressLine1": "123 Main St",
  "addressLine2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zip": "10001"
}
```

**Fields:**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| firstName | string | Yes | First name | 1-50 chars |
| lastName | string | Yes | Last name | 1-50 chars |
| addressLine1 | string | Yes | Street address | 1-100 chars |
| addressLine2 | string | No | Apt/Suite number | 0-100 chars |
| city | string | Yes | City | 1-50 chars |
| state | string | Yes | State code | 2 chars (e.g., "NY") |
| zip | string | Yes | ZIP code | 5 or 9 digits (12345 or 12345-6789) |

**Response:**

```json
{
  "success": true,
  "message": "Billing address updated successfully",
  "data": {
    "id": "user_123",
    "billingAddressLine1": "123 Main St",
    "billingAddressLine2": "Apt 4B",
    "billingCity": "New York",
    "billingState": "NY",
    "billingZip": "10001"
  }
}
```

**Errors:**
- `400`: Validation error (invalid state code, ZIP format, etc.)

---

### Get Account Balance

Get the current user's account balance.

**Endpoint:** `GET /api/users/balance`

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 100.00,
    "currency": "USD"
  }
}
```

---

## Payments API

### Create Deposit Checkout Session

Create a Stripe checkout session for adding funds to account balance.

**Endpoint:** `POST /api/payment/deposit`

**Authentication:** Required

**Request Body:**

```json
{
  "amount": 50.00
}
```

**Fields:**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| amount | decimal | Yes | Deposit amount (USD) | Min: $10.00, Max: $1000.00 |

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

**Notes:**
- Redirect user to `url` to complete payment
- Stripe will handle payment collection
- On success, user is redirected to `/account?deposit=success`
- On cancel, user is redirected to `/account?deposit=cancel`
- Webhook updates user balance automatically

---

### Purchase Lead

Purchase a lead using account balance.

**Endpoint:** `POST /api/payment/purchase-lead/:leadId`

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (8 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Lead purchased successfully",
  "data": {
    "purchase": {
      "id": "purchase_123",
      "userId": "user_123",
      "leadId": "NY123456",
      "price": 20.00,
      "purchasedAt": "2025-11-01T10:00:00.000Z"
    },
    "lead": {
      "id": "NY123456",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "weddingDate": "2026-09-15",
      "location": "New York, NY"
    },
    "newBalance": 80.00
  }
}
```

**Errors:**
- `400`: Invalid lead ID
- `403`: Insufficient balance
- `404`: Lead not found
- `409`: Lead already purchased (by you or another user)

**Notes:**
- Lead price is deducted from account balance
- Contact information is revealed after purchase
- Transaction is atomic (all-or-nothing)

---

### Stripe Webhook Handler

Handle Stripe webhook events (internal use only).

**Endpoint:** `POST /api/payment/webhook`

**Authentication:** Stripe signature verification

**Events Handled:**
- `checkout.session.completed` - Deposit successful, add to balance

**Notes:**
- This endpoint is called by Stripe automatically
- Signature verification ensures authenticity
- Not intended for direct frontend use

---

## Pipedrive API (Admin)

All Pipedrive endpoints require admin authentication.

### Manual Sync Trigger

Manually trigger a Pipedrive lead sync.

**Endpoint:** `POST /api/pipedrive/sync-now`

**Authentication:** Required (Admin only)

**Response:**

```json
{
  "success": true,
  "message": "Sync completed successfully",
  "results": {
    "imported": 5,
    "updated": 3,
    "failed": 0,
    "total": 8,
    "duration": "2.3s",
    "timestamp": "2025-11-01T14:00:00.000Z"
  }
}
```

**Errors:**
- `403`: Not an admin user
- `409`: Sync already in progress

**Notes:**
- Automated sync runs 4 times daily (8am, 11am, 2pm, 5pm EST)
- This endpoint allows manual on-demand sync
- Sync prevents concurrent runs (only one at a time)

---

### Get Sync Status

Get the status of the last Pipedrive sync.

**Endpoint:** `GET /api/pipedrive/sync-status`

**Authentication:** Required (Admin only)

**Response:**

```json
{
  "success": true,
  "status": {
    "lastSync": "2025-11-01T14:00:00.000Z",
    "nextSync": "2025-11-01T17:00:00.000Z",
    "results": {
      "imported": 5,
      "updated": 3,
      "failed": 0,
      "total": 8,
      "duration": "2.3s"
    },
    "isSyncing": false
  }
}
```

**Errors:**
- `403`: Not an admin user

**Notes:**
- `isSyncing` indicates if a sync is currently running
- `nextSync` shows the next scheduled automated sync time

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request (validation error) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (e.g., not admin) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., already purchased) |
| 500 | Internal Server Error | Server error (logged for investigation) |

### Common Error Examples

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid lead ID format (must be 8 characters)"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Lead already purchased"
}
```

---

## Rate Limiting

**Rate Limit:** 100 requests per 15-minute window per IP address

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635780000
```

**Rate Limit Exceeded Response:**
```http
HTTP/1.1 429 Too Many Requests

{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

---

## Changelog

### v1.5.0 (2025-11-01)
- Added Pipedrive admin endpoints (`/api/pipedrive/sync-now`, `/api/pipedrive/sync-status`)
- Automated Pipedrive sync (4x daily)

### v1.4.0 (2025-11-01)
- Added lead feedback endpoints (`POST /api/leads/:leadId/feedback`)
- Added `hasFeedback` flag to purchased leads response
- Added $2.00 reward for feedback submissions

### v1.3.0 (2025-10-31)
- Added billing address endpoint (`PUT /api/users/billing-address`)
- Added favorites endpoints (`POST /DELETE /api/leads/:leadId/favorite`, `GET /api/leads/favorites/list`)
- Added `isFavorited` flag to leads responses
- Added `favoritesOnly` query parameter to `/api/leads`

---

**Last Updated:** November 1, 2025
**Maintained by:** Claude Code
**Generated with:** [Claude Code](https://claude.com/claude-code)
