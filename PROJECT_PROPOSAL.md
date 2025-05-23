# Sun-Kissed & Southern 🌞🌴  
*Capstone Project Proposal*

## 🧰 Tech Stack

- **Backend**: Python Flask (REST API)
- **Frontend**: React (Vite + JSX)
- **Database**: PostgreSQL
- **Deployment**: Render (backend), Netlify (frontend)
- **APIs**:
  - [Cardknox API](https://docs.cardknox.com/api/transaction) – Payment processing (sandbox mode implemented)
  - [OpenWeatherMap API](https://openweathermap.org/api) – Optional blog weather widget
  - (Optional for expansion) [KeyDelivery (KD100) API](https://www.kd100.com/docs/create-tracking) – Shipment tracking

## 🔄 Project Focus

A full-stack ecommerce platform for a Florida beach lifestyle brand, built with production-level polish and real-world functionality — from variant-level inventory to full order lifecycle management and payment processing.

## 🌐 App Type

Responsive ecommerce platform (mobile + desktop) tailored to a boutique brand with an editorial and lifestyle focus.

## 🎯 Project Goals

Deploy a branded ecommerce experience with:

- Dynamic product catalog and variants (color, size, price)
- End-to-end checkout flow (cart → payment → confirmation)
- Coupon & promo code support
- Full admin dashboard (inventory, orders, returns, discounts, blog)
- Clean responsive UI with professional styling
- Marketing blog & featured content

## 👩 Target Users

Women aged 25–45 shopping for beachy and southern-inspired apparel and lifestyle products. Optimized for mobile users, repeat buyers, and admins managing a small-to-medium-sized product catalog.

## 📊 Data & APIs

- PostgreSQL for all relational data: products, users, orders, variants, coupons, returns
- **Cardknox sandbox**: used for simulating secure token-based payments (supports production upgrade with live key swap)
- (Optional) KD100 API for tracking number visibility
- OpenWeatherMap for dynamic blog weather snippets

## 🧩 Core Functionality

- **Authentication**: JWT-based login/signup with role-based permissions
- **Products**: Fully featured product/variant system (SKU, image, quantity, sale pricing)
- **Cart**: LocalStorage cart (guest or logged in), with variant awareness
- **Checkout**: Secure checkout with Cardknox sandbox and form validation
- **Coupons**: Fixed or percentage discounts with min order thresholds
- **Admin Tools**:
  - Manage products, variants, orders, returns, blog posts
  - Assign tracking numbers, restock returns, mark fulfillment
  - View low-stock alerts and analytics
- **Customer Tools**:
  - View orders and tracking
  - Submit returns or reviews
  - Favorite products for later
- **Blog CMS**: Create/edit lifestyle blog posts with rich content support

## 💡 Enhanced Functionality

- ✅ Variant-level discount logic and inventory
- ✅ Responsive image zoom with `transform-origin` and mouse tracking
- ✅ Admin analytics: revenue, fulfillment summary, low stock, top customers
- ✅ Full return lifecycle: user-initiated → admin approval → refund/restock
- ✅ Role-based API access (admin)
- ✅ Toast alerts, review moderation, inline tracking editing
- ✅ Modular admin CSS + mobile-optimized styling
- ✅ Sale product banners, category grid, and modal-based product detail view

## 🧭 User Flow

1. Browse → filter by category → view product modal  
2. Add variant to cart (size/color-specific)  
3. Checkout: log in, enter address + payment  
4. Cardknox token simulates real payment  
5. View order confirmation page + summary  
6. Admins fulfill + ship → customer gets tracking + status updates  
7. Returns optional per item with reason modal  

## 🛡️ Security & Readiness Notes

- ✅ Secure JWT auth system w/ localStorage token management  
- ✅ `.env` protected Cardknox and secret keys  
- ✅ Route protection (admin/customer_service)  
- ✅ Payment simulated via **Cardknox sandbox**, switchable to live with production keys  
- ✅ Tracking input currently manual, but **KeyDelivery API** is integrated-ready  

## 🚀 Stretch Goals (Not Yet Implemented)

- Saved payment method support (via Cardknox tokenization)  
- Customer email/text notifications on order status   
- Public-facing sale pages beyond the homepage banner  
- KD100 auto-tracking UI integration  

## 🗺️ Timeline (Adjusted & Completed)

While the core capstone was structured around a 4-week sprint, the project evolved over ~6 weeks due to external work obligations. This timeline reflects the actual pacing:

- **Weeks 1–2**: Backend setup (models, routes, database schema), authentication, product and variant logic  
- **Weeks 3–4**: Frontend structure, cart and checkout integration (Cardknox), admin tools (products, users, returns)  
- **Weeks 5–6**: Coupon/discount logic, order/return lifecycle, blog CMS, reviews, analytics, styling, deployment   

## 📁 Database Schema

📌 View the live schema:  
👉 [https://dbdiagram.io/d/Sun-Kissed-and-Southern-67d1b7cf75d75cc844d787ff](https://dbdiagram.io/d/Sun-Kissed-and-Southern-67d1b7cf75d75cc844d787ff)

📸 Visual Schema:

![Database Schema](./assets/database-schema.png)

---
