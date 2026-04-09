# Vehicle Check Backend — Complete API Guide

**Base URL:** `http://localhost:3000/api/v1`
**Swagger Docs:** `http://localhost:3000/api/docs`

---

## Step 1: Register a User

```
POST /api/v1/auth/register
```

**Body:**
```json
{
  "fullName": "Kashif Hussain",
  "email": "kashif.hussain23@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "data": {
    "_id": "664abc...",
    "fullName": "Kashif Hussain",
    "email": "kashif.hussain23@gmail.com",
    "role": "user"
  }
}
```

---

## Step 2: Login (Get Token)

```
POST /api/v1/auth/login
```

**Body:**
```json
{
  "email": "kashif.hussain23@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "664abc...",
      "fullName": "Kashif Hussain",
      "email": "kashif.hussain23@gmail.com"
    }
  }
}
```

> **IMPORTANT:** Copy the `accessToken` — you need it for ALL protected endpoints.
> Add header: `Authorization: Bearer <your_token>`

---

## Step 3: Vehicle Check APIs (Main Features)

### 3A: Smart Car Check (Auto Free/Paid based on Subscription)

> **This is the MAIN endpoint for frontend** — automatically uses paid DVLA key if user is subscribed, free key otherwise.

```
POST /api/v1/check-car/check
Authorization: Bearer <token>
```

**Body:**
```json
{
  "registrationNumber": "AA19AAA"
}
```

> **Note:** Only plates with "A" in them work for testing with the paid API key.

**Response:**
```json
{
  "message": "Car check successful",
  "data": {
    "_id": "...",
    "registrationNumber": "AA19AAA",
    "keyType": "free",
    "heroSection": {
      "registrationNumber": "AA19AAA",
      "vehicleName": "BMW",
      "tax": { "expiryDate": "2025-07-01", "daysLeft": "83 days" },
      "mot": { "expiryDate": "2025-08-15", "daysLeft": "128 days" }
    },
    "vehicleDetails": {
      "modelVariant": "BMW",
      "primaryColour": "BLACK",
      "fuelType": "DIESEL",
      "engine": "1995 cc",
      "yearOfManufacture": 2019
    }
  }
}
```

### 3B: Free DVLA Check (Always uses free key)

```
POST /api/v1/check-car/free
Authorization: Bearer <token>
```

**Body:**
```json
{
  "registrationNumber": "AA19AAA"
}
```

### 3C: Paid DVLA Check (Always uses paid key)

```
POST /api/v1/check-car/paid
Authorization: Bearer <token>
```

**Body:**
```json
{
  "registrationNumber": "AA19AAA"
}
```

### 3D: MOT History (Subscription-Aware)

> Returns full MOT test history from DVSA + DVLA data.

```
POST /api/v1/check-car/mot-history
Authorization: Bearer <token>
```

**Body:**
```json
{
  "registrationNumber": "AA19AAA"
}
```

**Response:**
```json
{
  "message": "MOT history fetched successfully",
  "data": {
    "vehicle": {
      "registrationNumber": "AA19AAA",
      "heroSection": { "..." },
      "vehicleDetails": { "..." }
    },
    "motHistory": {
      "registrationNumber": "AA19AAA",
      "make": "BMW",
      "totalTests": 5,
      "totalPassed": 4,
      "totalFailed": 1,
      "latestTestResult": "PASSED",
      "lastMileage": 45230,
      "motTests": [
        {
          "testResult": "PASSED",
          "completedDate": "2024-08-10",
          "expiryDate": "2025-08-15",
          "odometerValue": "45230"
        }
      ]
    }
  }
}
```

---

## Step 4: CarTax API (RapidAPI — Comprehensive Report)

> Returns detailed vehicle data from CarTax/RapidAPI including tax, MOT, mileage, performance, fuel economy, emissions, and more.

```
POST /api/v1/car-tax/check
Authorization: Bearer <token>
```

**Body:**
```json
{
  "vrm": "AA19AAA"
}
```

**Response:**
```json
{
  "message": "Car check completed successfully",
  "data": {
    "_id": "...",
    "registrationNumber": "AA19AAA",
    "reportType": "initial",
    "keyType": "paid",
    "status": {
      "taxStatus": "Taxed",
      "taxDueDate": "2025-07-01",
      "taxDaysLeft": 83,
      "motStatus": "Valid",
      "motExpiryDate": "2025-08-15",
      "motDaysLeft": 128
    },
    "vehicleDetails": {
      "make": "BMW",
      "model": "3 SERIES",
      "colour": "BLACK",
      "fuelType": "DIESEL",
      "transmission": "AUTOMATIC",
      "engineCapacity": "1995",
      "yearOfManufacture": 2019
    },
    "mileage": {
      "lastMotMileage": "45230",
      "estimatedCurrentMileage": "52000"
    },
    "performance": {
      "powerBhp": "190",
      "maxSpeedMph": "155",
      "zeroTo60Mph": "7.1"
    },
    "fuelEconomy": {
      "urbanMpg": "47.9",
      "combinedMpg": "57.6"
    },
    "roadTax": {
      "cost12Months": "165",
      "co2Emissions": "128"
    },
    "dvlaData": { "...raw DVLA response..." }
  }
}
```

---

## Step 5: View Saved Reports

### Get All My Car Check Reports

```
GET /api/v1/check-car/my-checkcar?page=1&limit=10
Authorization: Bearer <token>
```

### Get All My CarTax Reports

```
GET /api/v1/car-tax/my-reports?page=1&limit=10
Authorization: Bearer <token>
```

### Get Single Report by ID

```
GET /api/v1/check-car/single/<report_id>
Authorization: Bearer <token>
```

```
GET /api/v1/car-tax/single/<report_id>
Authorization: Bearer <token>
```

### Get MOT History by Registration

```
GET /api/v1/mot-history/registration/AA19AAA
Authorization: Bearer <token>
```

---

## Step 6: Subscription System

### 6A: View Available Plans (No Auth Required)

```
GET /api/v1/subscribe
```

**Response:**
```json
{
  "data": [
    {
      "_id": "664def...",
      "planName": "Premium",
      "price": 9.99,
      "features": ["Unlimited checks", "MOT history", "Paid DVLA data"],
      "user": ["664abc..."]
    }
  ]
}
```

### 6B: Create a Plan (Admin Only)

```
POST /api/v1/subscribe
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "planName": "Premium",
  "price": 9.99,
  "features": ["Unlimited checks", "MOT history", "Paid DVLA data"]
}
```

### 6C: Pay for Subscription (Stripe)

```
POST /api/v1/payment/<subscribe_id>
Authorization: Bearer <token>
```

**No body needed** — the subscribe ID is in the URL.

**Response:**
```json
{
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

> Use `clientSecret` in your frontend Stripe.js to complete the payment.
> When Stripe confirms payment, the webhook (`POST /api/v1/webhook`) automatically adds the user to the subscription plan.

---

## Step 7: Admin Endpoints

### Dashboard Overview

```
GET /api/v1/dashboard/overview
Authorization: Bearer <admin_token>
```

### Dashboard Chart (Monthly Revenue)

```
GET /api/v1/dashboard/chart?year=2026
Authorization: Bearer <admin_token>
```

### Get All Users

```
GET /api/v1/user?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get All Payments

```
GET /api/v1/payment?page=1&limit=10
Authorization: Bearer <admin_token>
```

### Get All Contacts

```
GET /api/v1/contact?page=1&limit=10
Authorization: Bearer <admin_token>
```

---

## Step 8: Other Endpoints

### Update Profile

```
PUT /api/v1/user/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
- `fullName`: "Updated Name"
- `phoneNumber`: "+44123456789"
- `profilePicture`: (file upload)

### Submit Contact Form (No Auth)

```
POST /api/v1/contact
```

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+441234567890",
  "message": "I have a question about your service"
}
```

### Forgot Password Flow

```
POST /api/v1/auth/forgot-password
Body: { "email": "kashif.hussain23@gmail.com" }

POST /api/v1/auth/verify
Body: { "email": "kashif.hussain23@gmail.com", "otp": "123456" }

POST /api/v1/auth/reset-password
Body: { "email": "kashif.hussain23@gmail.com", "newPassword": "newpass123" }
```

---

## How Subscription + Paid API Logic Works

```
User registers → Login → Gets token
                              ↓
              POST /check-car/check  { "registrationNumber": "AA19AAA" }
                              ↓
                    Is user subscribed?
                     /              \
                   YES               NO
                    ↓                 ↓
            Paid DVLA Key       Free DVLA Key
      (dea218d6-0c75-...)    (B5fnZJm6F7ax...)
                    ↓                 ↓
              Premium data       Basic data
              keyType: "paid"    keyType: "free"
```

**How a user gets subscribed:**
1. Admin creates a plan: `POST /subscribe`
2. User pays: `POST /payment/<planId>` → Gets Stripe clientSecret
3. Frontend completes Stripe payment
4. Stripe webhook fires → User added to `Subscribe.user[]` array
5. Next car check automatically uses paid DVLA key

---

## Test Number Plates (with "A")

For testing with the paid API key, use plates containing "A":

- `AA19AAA`
- `AB12CDE`
- `BA51CAT`
- `VA12ABC`

---

## Postman Quick Setup

1. Set base URL variable: `{{base_url}}` = `http://localhost:3000/api/v1`
2. Login and save token to variable: `{{token}}`
3. Add to all protected requests header: `Authorization: Bearer {{token}}`
