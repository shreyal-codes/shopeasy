# ShopEasy - E-Commerce Web Application

ShopEasy is a small full-stack online shopping website. Customers can browse products, add them to a cart and place a Cash on Delivery order. An admin can manage products, categories and orders.

Built as my internship project (individual MVP) with **HTML, CSS, vanilla JavaScript, Node.js, Express and SQLite**.

Author: shreyal choudhary &nbsp;|&nbsp; 
Internship / Batch: shreyal choudhary &nbsp;|&nbsp; 
Submitted: 29/10/2026

---

## Table of contents
1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Screenshots](#screenshots)
4. [Setup and run](#setup-and-run)
5. [Login credentials](#login-credentials)
6. [Project structure](#project-structure)
7. [Database design and ER diagram](#database-design-and-er-diagram)
8. [REST API list](#rest-api-list)
9. [Security and validation](#security-and-validation)
10. [Testing with Postman](#testing-with-postman)
11. [Requirements checklist](#requirements-checklist)
12. [Problems I faced and what I learned](#problems-i-faced-and-what-i-learned)
13. [Future improvements](#future-improvements)

---

## Features

**Guest:** view products, search, filter by category, sort by price, pagination, product detail page, register / login.

**Customer:** everything a guest can do, plus
- shopping cart (add, change quantity, remove) with live item count in the navbar
- checkout with shipping address (Cash on Delivery only)
- order confirmation page, order history and order detail page
- cancel an order while it is still *Placed* (stock is restored)

**Admin:**
- dashboard with total products, orders, customers and sales, plus a low-stock list
- product add / edit / delete (delete only hides the product so old orders stay correct)
- category add / rename / delete
- view all orders and move status forward: Placed -> Shipped -> Delivered
- products with stock below 5 are highlighted

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3 (Flexbox + Grid), JavaScript ES6, Fetch API |
| Backend | Node.js, Express.js (REST API, JSON) |
| Database | SQLite using Node's built-in `node:sqlite` module (no native package to compile) |
| Security | `bcryptjs` (password hashing), `jsonwebtoken` (JWT), `dotenv` |
| Tools | VS Code, Git/GitHub, Postman, DB Browser for SQLite |

## Screenshots

### Customer side
| Home - product grid, search, filter, pagination | Product detail |
|---|---|
| ![Home](docs/screenshots/01-home.png) | ![Product](docs/screenshots/02-product-detail.png) |

| Login | Register |
|---|---|
| ![Login](docs/screenshots/03-login.png) | ![Register](docs/screenshots/04-register.png) |

| Search + category filter | Cart |
|---|---|
| ![Search](docs/screenshots/05-search-filter.png) | ![Cart](docs/screenshots/06-cart.png) |

| Checkout | Order confirmation |
|---|---|
| ![Checkout](docs/screenshots/07-checkout.png) | ![Success](docs/screenshots/08-order-success.png) |

**My Orders**

![My orders](docs/screenshots/09-my-orders.png)

### Admin side
| Dashboard | Manage products |
|---|---|
| ![Dashboard](docs/screenshots/10-admin-dashboard.png) | ![Products](docs/screenshots/11-admin-products.png) |

| Edit product (modal) | Categories |
|---|---|
| ![Edit](docs/screenshots/12-admin-edit-product.png) | ![Categories](docs/screenshots/13-admin-categories.png) |

**Manage orders**

![Admin orders](docs/screenshots/14-admin-orders.png)

### Mobile view (360px+)
| Home | Menu |
|---|---|
| ![Mobile home](docs/screenshots/15-mobile-home.png) | ![Mobile menu](docs/screenshots/16-mobile-menu.png) |

## Setup and run

**You need:** [Node.js](https://nodejs.org) **version 22.13 or newer** (24 LTS works), and Git. Python or C++ build tools are *not* needed.

```bash
# 1. get the code
git clone https://github.com/shreyal-codes/shopeasy.git
cd shopeasy

# 2. install packages
npm install

# 3. create your .env file
copy .env.example .env        # Windows (PowerShell / CMD). On Mac/Linux: cp .env.example .env
#    then open .env and change JWT_SECRET to any long random text

# 4. start the server
npm start
```

Open **http://localhost:3000** in the browser.

You will see a yellow "SQLite is an experimental feature" warning in the terminal. It is harmless.

On the first start the app creates `server/shopeasy.db`, runs `schema.sql` and `seed.sql` (3 categories, 15 products) and adds the admin and demo customer accounts. To wipe everything and start again:

```bash
npm run db:reset
npm start
```

## Login credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shopeasy.com` | `admin123` |
| Customer (demo) | `customer@shopeasy.com` | `customer123` |

You can also register a new customer from the Register page.

## Project structure

```
shopeasy/
├── server/
│   ├── app.js                  # Express setup, routes, error handler
│   ├── db.js                   # SQLite connection + first-run setup
│   ├── reset.js                # deletes the db file (npm run db:reset)
│   ├── schema.sql              # table definitions
│   ├── seed.sql                # sample categories and products
│   ├── middleware/
│   │   ├── auth.js             # checks the JWT token
│   │   ├── adminOnly.js        # blocks non-admin users (403)
│   │   └── validate.js         # input validation helpers
│   ├── routes/                 # auth, products, categories, cart, orders, admin
│   └── controllers/            # logic for each route file
├── public/
│   ├── index.html, product.html, login.html, register.html,
│   │   cart.html, checkout.html, success.html, orders.html, order.html
│   ├── admin/                  # dashboard, products, categories, orders
│   ├── css/style.css
│   ├── js/                     # app.js (shared) + one script per page
│   └── images/                 # product images
├── docs/
│   ├── er-diagram.png / .mmd
│   ├── ShopEasy.postman_collection.json
│   └── screenshots/
├── .env.example
├── package.json
└── README.md
```

## Database design and ER diagram

![ER diagram](docs/er-diagram.png)

Six tables (full SQL in [`server/schema.sql`](server/schema.sql)):

| Table | Purpose |
|-------|---------|
| `users` | customers and admin (`role` column), password stored as bcrypt hash |
| `categories` | product categories |
| `products` | items for sale, linked to a category; `is_active` is used for soft delete |
| `cart_items` | one row per user + product (`UNIQUE(user_id, product_id)`) |
| `orders` | one row per order with shipping details and status |
| `order_items` | products inside an order, stores `unit_price` at purchase time |

**Relationships:** one category has many products; one user has many cart items and many orders; one order has many order items; each order item refers to one product.

**Design decisions**
- Prices are stored as **integers in paise** (Rs 1 = 100 paise) so there are no floating-point rounding errors.
- `order_items.unit_price` keeps the price at the time of purchase, so later price changes do not alter old orders.
- Products are **deactivated, not deleted**, because old orders still refer to them.
- `CHECK` constraints keep `stock >= 0`, `quantity > 0` and valid status values at database level.

**Example queries used in the project** (JOIN, filter, aggregate)
```sql
-- product list with category name, search + pagination
SELECT p.*, c.name AS category_name
FROM products p JOIN categories c ON c.id = p.category_id
WHERE p.is_active = 1 AND p.name LIKE ?
ORDER BY p.price ASC LIMIT 8 OFFSET 0;

-- cart with line totals
SELECT ci.id, ci.quantity, p.name, p.price, ci.quantity * p.price AS line_total
FROM cart_items ci JOIN products p ON p.id = ci.product_id
WHERE ci.user_id = ?;

-- dashboard: total sales (cancelled orders excluded)
SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'Cancelled';
```

## REST API list

All responses are JSON. Status codes used: `200/201` success, `400` validation error, `401` not logged in, `403` forbidden, `404` not found, `500` server error.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/me` | Current user info | Logged in |
| GET | `/api/products` | List products (`search`, `category`, `page`, `sort`) | Public |
| GET | `/api/products/:id` | Product details | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Deactivate product | Admin |
| GET | `/api/categories` | List categories | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Rename category | Admin |
| DELETE | `/api/categories/:id` | Delete category (only if empty) | Admin |
| GET | `/api/cart` | My cart with totals | Customer |
| POST | `/api/cart` | Add item `{productId, quantity}` | Customer |
| PUT | `/api/cart/:itemId` | Update quantity | Customer |
| DELETE | `/api/cart/:itemId` | Remove item | Customer |
| POST | `/api/orders` | Place order from cart (checkout) | Customer |
| GET | `/api/orders` | My orders | Customer |
| GET | `/api/orders/:id` | Order detail with items | Owner / Admin |
| PATCH | `/api/orders/:id/cancel` | Cancel order (only while Placed) | Customer |
| GET | `/api/admin/orders` | All orders | Admin |
| PATCH | `/api/admin/orders/:id/status` | Update order status | Admin |
| GET | `/api/admin/stats` | Dashboard counts | Admin |
| GET | `/api/admin/products` | All products including inactive | Admin |

Protected routes expect the header `Authorization: Bearer <token>`.

**Example**
```http
POST /api/auth/login
{ "email": "customer@shopeasy.com", "password": "customer123" }

200 OK
{ "token": "eyJhbGciOi...", "user": { "id": 2, "name": "Demo Customer", "role": "customer" } }
```

## Security and validation

- Passwords are hashed with bcrypt and never stored or returned as plain text.
- JWT is verified on every protected route; the role is read from the signed token, so changing things in the browser does not give admin access.
- All SQL uses **parameterized queries** (`?`), which prevents SQL injection.
- User content is escaped with an `esc()` function before it is shown in the page, which prevents XSS.
- Inputs are validated on the client **and** on the server (email, password length, phone, PIN code, price, stock, quantity).
- Secrets are in `.env` (not committed). `.env.example` shows the needed variables.
- Placing an order uses a **database transaction**: order creation, order items, stock reduction and emptying the cart all succeed together or not at all.
- Login gives the same error for a wrong email and a wrong password.

## Testing with Postman

1. Import `docs/ShopEasy.postman_collection.json` into Postman.
2. Start the server (`npm start`).
3. Run **Login as customer** and **Login as admin** first. They save the tokens in collection variables automatically.
4. Run the other requests in any order. The collection also contains negative tests (customer calling an admin API gives 403, out-of-stock product gives 400).

## Requirements checklist

| Module | Done |
|--------|------|
| Auth (AUTH-1 to AUTH-6) register, bcrypt, login with JWT, protected routes, 403 for customers, logout | Yes |
| Product catalogue (PRD-1 to PRD-7) grid, search, category filter, pagination, price sort, detail page, out-of-stock block | Yes |
| Cart (CRT-1 to CRT-5) add, totals, quantity limited by stock, remove, navbar badge | Yes |
| Checkout and orders (ORD-1 to ORD-5) validated form, COD, DB transaction, confirmation page, order history | Yes |
| ORD-6 Cancel order with stock restore (P3) | Yes |
| Admin (ADM-1 to ADM-5) dashboard, product CRUD, category CRUD, all orders, status update | Yes |
| ADM-6 Low-stock highlight (P3) | Yes |
| AUTH-7 Profile page (P3) | Not done |
| Deliverables: schema.sql, seed.sql, ER diagram, Postman collection, README | Yes |

## Problems I faced and what I learned

## Problems I faced and what I learned

1. **`npm install` failed on Windows (better-sqlite3).**
   The native SQLite package tried to compile from source on my Node 24 setup and needed Python and C++ build tools, which I did not have. I fixed it by switching to Node's built-in `node:sqlite` module and wrapping it in `server/db.js`, so the controllers could keep the same style of queries. I learned that native packages can break across Node versions and that checking the built-in options first can save time.

2. **Project would not start from the wrong folder.**
   `npm install` failed because I ran it in the outer folder instead of the folder containing `package.json`. I learned to check with `dir package.json` before running npm commands.

3. **File lock errors inside OneDrive (EBUSY / EPERM).**
   OneDrive was syncing `node_modules` while npm was writing to it. Keeping projects outside synced folders avoids this.

4. **Understanding why prices are stored as integers.**
   Storing prices in paise avoids floating point rounding errors when calculating totals.

5. **Making checkout safe with a transaction.**
   Creating the order, saving order items, reducing stock and emptying the cart must all succeed together. A database transaction rolls everything back if any step fails.

6. **Role checks must happen on the server.**
   Hiding admin links in JavaScript is not security. The server reads the role from the signed JWT, so a customer gets a 403 on admin APIs.

7. **Preventing XSS.**
   Text from the database is escaped with an `esc()` function before it is placed into the page with `innerHTML`.

8. Understanding why prices should be stored as integers instead of decimals.

9.Using a transaction so stock never goes wrong if one step of checkout fails.

11. Why role checks must happen on the server and not only in JavaScript.

12. Escaping text before putting it into `innerHTML`.

## Future improvements

- Profile page to update name and address
- Image upload with Multer
- Product reviews and wishlist
- Sales chart on the admin dashboard
- Automated API tests with Jest and Supertest
- Deployment on Render / Railway

---
*Internship project - ShopEasy by [Your Name]*
