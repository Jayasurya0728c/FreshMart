# FreshMart 🛒 — Grocery Delivery E-Commerce Application

A clean, responsive, full-stack grocery e-commerce web application built with **Django REST Framework** and **React 19 + Vite**. Designed with a focus on real-world usability, clean UI, fast performance, and an intuitive customer and administrator workflow.

---

## 🌟 Key Features

### Customer Experience
- **Grocery Catalog & Navigation**: Browse fresh groceries across categories (Fruits, Vegetables, Dairy, Bakery, Beverages, etc.).
- **Live Search & Filter**: Real-time product search, department filtering, in-stock toggle, and price sorting.
- **Product Details Modal**: View comprehensive product descriptions, pack/weight units (e.g. `1 kg`, `500 ml`), stock levels, and quantity steppers.
- **Shopping Basket & Persistent Cart**: Live quantity increments, real-time stock limits, and local storage synchronization.
- **Wishlist**: Quick-save favorite grocery items.
- **Dynamic Storefront Offers**: Announcement banner with active coupon discounts (e.g., `FRESH20`) and free delivery threshold calculations.
- **Customer Checkout**:
  - Multiple delivery address management (Add, Delete, Set Default).
  - Flexible payment methods (Cash on Delivery, UPI, Credit/Debit Card).
  - Coupon code redemption with instant subtotal recalculation.
  - Free delivery threshold meter.
- **Order Tracking**: Itemized receipts and 4-stage tracking stepper (`Pending` → `Packed` → `Out for Delivery` → `Delivered` / `Cancelled`).

### Store Administration
- **KPI Metrics Dashboard**: Overview of catalog count, low stock alerts, total customer orders, and sales revenue.
- **Product Inventory Management**: Create new grocery items with photo uploads, edit descriptions/pack units/pricing/stock, and delete items.
- **Order Fulfillment**: Track all customer orders, view items, delivery addresses, and update status in real-time.
- **Department/Category Management**: Add and manage grocery departments.
- **Special Offer Banner Control**: Directly customize the promotional banner, announcement text, coupon code, discount percentage, free delivery threshold, and toggle visibility.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19
  - Vite 8
  - Axios
  - Custom Responsive CSS (Mobile-first, desktop & tablet optimized)
- **Backend**:
  - Python 3 & Django 5.2
  - Django REST Framework (DRF)
  - SimpleJWT Authentication
  - Django CORS Headers
  - Pillow (Media uploads)
  - SQLite (with included initial data fixture)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (3.10 or higher)

### 1. Backend Setup (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Load initial grocery catalog & sample data
python manage.py loaddata store/fixtures/initial_data.json

# Start the Django development server
python manage.py runserver
```
The backend API will be available at `http://127.0.0.1:8000/`.

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will be running at `http://localhost:5173/`.

---

## 🔑 Default Credentials (for Testing)

| Role | Username | Password |
|---|---|---|
| **Admin / Store Staff** | `admin` | `admin` |
| **Customer Shopper** | `john_shopper` | `password123` |
