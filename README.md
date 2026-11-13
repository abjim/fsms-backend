# Field Service Management System (FSMS) Backend

Field Service Management System is a comprehensive enterprise operations and dispatch backend. Customers can submit service requests for home and commercial equipment breakdown. Dispatchers and Admins review requests, assign qualified technicians with automated schedule conflict detection, and schedule field visits. Technicians track visits, update real-time progress, and file service completion reports. Admins generate invoices which customers settle securely through SSLCommerz.

This is the backend repository for B7A6 Assignment (Problem Domain: Field Service Management).

## Live Links

- Live API: https://fsms-backend.vercel.app
- API Docs (Swagger UI): https://fsms-backend.vercel.app/api-docs
- Postman Collection: [docs/FSMS.postman_collection.json](./docs/FSMS.postman_collection.json)

## Demo Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@fsms.com | Admin@1234 | Review requests, assign technicians, generate invoices, audit logs |
| Customer | customer@fsms.com | Customer@123 | Submit requests, view invoices, pay via SSLCommerz, leave reviews |
| Technician | tech@fsms.com | Tech@1234 | Set weekly slots, manage visit lifecycle, submit service reports |

These demo accounts are pre-seeded in the database. On live environments, their passwords and account status are protected against deletion.

## Tech Stack

- **Runtime & Language**: Node.js, TypeScript, Express.js
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Validation**: Zod schema validation
- **Authentication**: JWT (Bearer Access Token and Refresh Token) with bcrypt password hashing
- **Security**: Helmet, express-rate-limit, CORS, standardized error handler
- **Payment Gateway**: SSLCommerz (SandBox and Live gateway with IPN validation)
- **API Documentation**: Interactive Swagger UI (`/api-docs`) and Postman Collection
- **Deployment**: Vercel Serverless Functions

## The 3 Primary Roles and Key Features

### 1. Customer
- Register and login with JWT authentication
- Browse service categories and find certified technicians
- Submit service requests with location, issue description, and preferred appointment time
- Track request and work order progress in real time
- Receive invoices and initiate SSLCommerz payment
- Submit ratings and reviews upon job completion

### 2. Technician
- Update profile with skills, bio, service areas, and hourly rate
- Configure weekly working availability slots (Saturday to Thursday, 09:00 to 18:00)
- Toggle real-time availability status
- View assigned work orders and schedule
- Transition visit states: SCHEDULED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED
- Submit detailed service completion reports (problem diagnosed, work done, parts used, labor hours)

### 3. Admin (Dispatcher and Operations Manager)
- Manage service categories with soft delete
- View all service requests with advanced filters (status, priority, city, pagination)
- Assign technicians to work orders with automated schedule conflict detection
- Generate invoices for completed jobs with labor, parts, and tax calculation
- View business metrics (total requests, active visits, revenue, technician performance)
- Inspect full system audit logs tracking critical state changes
- Manage user status (activate or suspend accounts)

## Work Order Lifecycle

```text
Service Request (PENDING)
       │
       ▼
Admin Review & Approval
       │
       ▼
Technician Assignment (SCHEDULED) [Conflict Check Enforced]
       │
       ▼
Technician En Route (EN_ROUTE)
       │
       ▼
Work Started (IN_PROGRESS)
       │
       ▼
Work Completed & Service Report (COMPLETED)
       │
       ▼
Invoice Generated (ISSUED)
       │
       ▼
SSLCommerz Payment (PAID)
       │
       ▼
Customer Rating & Feedback
```

## Schedule Conflict Prevention

When an admin assigns a technician to a work order:
1. The system verifies the technician works on that specific day of the week.
2. The visit start and end times must fit within the technician availability slot.
3. The system checks database records inside a Prisma transaction to ensure the technician has no other overlapping active work orders on that calendar date.
4. If an overlap is detected, the API returns a 409 Conflict error with a descriptive message.

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

JWT_ACCESS_SECRET="your_jwt_access_secret_key"
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"
JWT_REFRESH_EXPIRES_IN=30d

BCRYPT_SALT_ROUNDS=12

ADMIN_EMAIL=admin@fsms.com
ADMIN_PASSWORD=Admin@1234

SERVER_URL=http://localhost:5000

SSL_STORE_ID=your_ssl_store_id
SSL_STORE_PASSWORD=your_ssl_store_password
SSL_IS_LIVE=false
```

## Local Installation and Setup

1. Clone the repository and navigate to the project directory:
   ```bash
   cd FSMS-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   # fill in your database and sslcommerz credentials
   ```

4. Push database schema:
   ```bash
   npm run migrate
   # or
   npx prisma db push
   ```

5. Seed database with initial categories and demo accounts:
   ```bash
   npm run seed
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

7. Access Swagger documentation at: `http://localhost:5000/api-docs`

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register customer or technician |
| POST | `/api/v1/auth/login` | Public | Login with email and password |
| POST | `/api/v1/auth/refresh-token` | Public | Refresh JWT access token |
| POST | `/api/v1/auth/change-password` | Protected | Change password |
| GET | `/api/v1/users/me` | Protected | Get own profile |
| PATCH | `/api/v1/users/me` | Protected | Update own profile |
| GET | `/api/v1/users` | Admin | List all users with filters |
| GET | `/api/v1/categories` | Public | List active service categories |
| POST | `/api/v1/categories` | Admin | Create new category |
| PATCH | `/api/v1/categories/:id` | Admin | Update category |
| DELETE | `/api/v1/categories/:id` | Admin | Soft delete category |
| GET | `/api/v1/technicians` | Public | Browse technicians with filters |
| GET | `/api/v1/technicians/:id` | Public | Get technician detailed profile |
| PUT | `/api/v1/technicians/availability` | Technician | Configure weekly time slots |
| PATCH | `/api/v1/technicians/status` | Technician | Toggle availability status |
| POST | `/api/v1/service-requests` | Customer | Submit new service request |
| GET | `/api/v1/service-requests` | Customer/Admin | List requests (role-based) |
| GET | `/api/v1/service-requests/:id` | Customer/Admin | Get service request details |
| PATCH | `/api/v1/service-requests/:id` | Customer/Admin | Update request details |
| POST | `/api/v1/service-requests/:id/cancel` | Customer/Admin | Cancel service request |
| POST | `/api/v1/work-orders/assign` | Admin | Assign technician with conflict check |
| GET | `/api/v1/work-orders` | Protected | List work orders (role-based) |
| GET | `/api/v1/work-orders/:id` | Protected | Work order detail |
| PATCH | `/api/v1/work-orders/:id/status` | Tech/Admin | Update lifecycle status |
| POST | `/api/v1/service-reports` | Technician | Submit job completion report |
| GET | `/api/v1/service-reports/work-order/:id` | Protected | Get report for work order |
| POST | `/api/v1/invoices/generate` | Admin | Generate invoice for completed order |
| GET | `/api/v1/invoices` | Protected | List invoices (role-based) |
| GET | `/api/v1/invoices/:id` | Protected | Get invoice details |
| POST | `/api/v1/payments/initiate` | Customer | Initiate SSLCommerz checkout session |
| POST | `/api/v1/payments/ssl/success` | Public | Gateway payment success callback |
| POST | `/api/v1/payments/ssl/fail` | Public | Gateway payment fail callback |
| POST | `/api/v1/payments/ssl/cancel` | Public | Gateway payment cancel callback |
| POST | `/api/v1/payments/ssl/ipn` | Public | Gateway IPN validation webhook |
| GET | `/api/v1/payments/my-history` | Customer | View customer payment history |
| POST | `/api/v1/reviews` | Customer | Submit review for completed job |
| GET | `/api/v1/reviews/technician/:id` | Public | View reviews for technician |
| GET | `/api/v1/admin/dashboard-stats` | Admin | Aggregate business metrics |
| GET | `/api/v1/admin/audit-logs` | Admin | View system audit logs |
| PATCH | `/api/v1/admin/users/:id/status` | Admin | Suspend or activate user |

## Submission Information

```text
Project Name    : Field Service Management System (FSMS)
Backend Repo    : https://github.com/abjim/fsms-backend
Live API        : https://fsms-backend.vercel.app
API Docs        : https://fsms-backend.vercel.app/api-docs
Admin Email     : admin@fsms.com
Admin Password  : Admin@1234
```
