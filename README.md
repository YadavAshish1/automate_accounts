# Automate Accounts Developer Hiring Assessment

## Overview
This project automates the extraction of key details from scanned PDF receipts using OCR/AI techniques and stores the data in a structured SQLite database. It provides a RESTful API for uploading, validating, processing, and retrieving receipt information.

---

## Features
- Upload scanned receipts (PDF format)
- Validate uploaded files to ensure they are valid PDFs
- Extract key details (date, merchant, total, etc.) using OCR
- Store extracted data in SQLite (`receipts.db`)
- REST APIs for managing and retrieving receipts
- Handles duplicate uploads by updating existing records

---

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher recommended)
- npm
- install the required libraries: express, sqlite3, multer, tesseract.js, pdf-lib, dotenv, bcrypt, jsonwebtoken,pdf-poppler, console, path, fs, cors

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/YadavAshish1/automate_accounts.git
   cd automate_accounts
   ```
2. Install dependencies:
   ```sh
   npm install express, sqlite3, multer, tesseract.js, pdf-lib, dotenv, bcrypt, jsonwebtoken,pdf-poppler, console, path, fs, cors
   ```


## Environment Variables

Before running the project, you must add your JWT secret key to the `.env` file for authentication purposes. This is required for the API to function securely, including register and login endpoints.

Create a `.env` file if not available and Add the following line to your `.env` file (replace `your_jwt_secret_key` with your own secret key):

```
JWT_SECRET=your_jwt_secret_key
```
---

## Running the Application
```sh
npm run dev or npm start
```
The server will start on the configured port (default: 3000).

---

## API Usage

### 1. Register
**Endpoint:** `POST auth/register`
- Registers a new user account.
- Request body:
  ```json
  {"username": "your_username", "password": "your_password"}
  ```
- Response:
  ```json
  {"message": "User registered successfully"}
  ```

### 2. Login
**Endpoint:** `POST auth/login`
- Authenticates a user and returns a JWT token.
- Request body:
  ```json
  {"username": "your_username", "password": "your_password"}
  ```
- Response:
  ```json
  {"token": "<jwt_token>"}
  ```

Use the returned JWT token in the `Authorization` header as `Bearer <jwt_token>` for protected endpoints.

### 3. Upload Receipt
**Endpoint:** `POST /upload`
- Upload a PDF receipt.
- Request: `multipart/form-data` with `receipt` field.
- Response:
  ```json
  {"message": "File uploaded successfully", "fileId": 1}
  ```

### 2. Validate Receipt
**Endpoint:** `POST /validate/{fileId}`
- Validates if the uploaded file is a valid PDF.
- Request body:
  ```json
  {"fileId": 1}
  ```
- Response:
  ```json
  {"is_valid": true, "invalid_reason": null}
  ```

### 3. Process Receipt
**Endpoint:** `POST /process/{fileId}`
- Extracts details from the receipt using OCR.
- Request body:
  ```json
  {"fileId": 1}
  ```
- Response:
  ```json
  {"message": "Receipt processed", "receiptId": 1}
  ```

### 4. List Receipts
**Endpoint:** `GET /receipts`
- Returns all processed receipts.
- Response:
  ```json
  [
    {"id":1,"merchant_name":"Starbucks","total_amount":5.99,"purchased_at":"2023-12-09T10:00:00Z",...}
  ]
  ```

### 5. Get Receipt by ID
**Endpoint:** `GET /receipts/{id}`
- Returns details for a specific receipt.
- Response:
  ```json
  {"id":1,"merchant_name":"Starbucks","total_amount":5.99,"purchased_at":"2023-12-09T10:00:00Z",...}
  ```

---

## Database Schema
- `receipt_file`: Stores uploaded file metadata
- `receipt`: Stores extracted receipt data

---

## Dependencies
- express
- sqlite3
- multer
- tesseract.js 
- Additional dependencies as listed in `package.json`

---

## Execution Instructions
1. Start the server: `npm run dev or npm start`
2. Use API tools like Postman or curl to interact with the endpoints.
3. Uploaded files are stored in the `uploads/` directory.
4. The SQLite database is `receipts.db` in the project root.

---
