# Sun-Kissed & Southern 🌞🌴  
*Capstone Project Proposal*

## 🧰 Tech Stack

- **Backend**: Python Flask (REST API)
- **Frontend**: React (Vite + JSX)
- **Database**: PostgreSQL
- **Deployment**: Render or Railway for backend, Netlify or Vercel for frontend
- **APIs**:
  - [Cardknox API](https://docs.cardknox.com/api/transaction) for payment processing
  - [KD100/KeyDelivery API](https://www.kd100.com/docs/create-tracking) for shipment tracking
  - Optional: [OpenWeatherMap API](https://openweathermap.org/api) for lifestyle blog weather snippets

## 🔄 Project Focus

This will be a **full-stack web application** with equal focus on backend structure and frontend design. I want to build a site that’s clean, responsive, and production-ready from both a user and engineering standpoint.

## 🌐 App Type

This is a responsive **ecommerce website** designed for desktop and mobile browsers.

## 🎯 Project Goal

The goal is to deploy a fully functioning ecommerce store for a Florida beach lifestyle brand. This will include:

- Product catalog
- User registration and login
- Shopping cart & order checkout
- Order tracking
- Admin dashboard for managing products/orders
- A blog promoting the Florida lifestyle

## 👩 Target Users

The primary demographic is **women aged 25–45**, interested in Florida/country-inspired beachwear and lifestyle. These are users familiar with online shopping and social media trends.

## 📊 Data & APIs

- **Products & Orders** will be managed in a PostgreSQL database I’ve modeled [here](https://dbdiagram.io/d/Sun-Kissed-and-Southern-67d1b7cf75d75cc844d787ff).
- **Payment Transactions** will be handled securely using Cardknox's sandbox API.
- **Shipping Tracking** will integrate KD100/KeyDelivery for real-time updates.
- Optionally, a weather API will support dynamic blog content.

> I will generate all necessary seed data for initial products and users. APIs will supplement transactional features.

## 🧩 App Functionality

- User authentication & session management
- Product catalog and filtering
- Cart and checkout
- Payment integration
- Order confirmation and tracking
- Admin dashboard (CRUD interface for products/orders)
- Blog section with optional weather-based content

## 🧭 User Flow

1. User browses site (home → product detail pages)
2. Adds items to cart → logs in or signs up
3. Proceeds to checkout (Cardknox transaction)
4. Views order confirmation and shipment status
5. (Admin user) logs in to update product inventory, manage orders

## 🛡️ Security & API Concerns

- **Sensitive Info**: Cardknox API keys and user data will be protected with environment variables and secure sessions.
- **API Challenges**: KD100 requires key registration and proper formatting; fallback for tracking will be logged.
- **Frontend Auth**: Will use local storage for token persistence and axios for secured requests.

## 💡 Features Beyond CRUD

- Third-party payment and shipment API integrations
- Admin panel for product/order management
- Optional blog with weather-based lifestyle posts
- Responsive and styled with modern UI libraries (e.g., TailwindCSS or Bootstrap)

## 🚀 Stretch Goals

- User profiles with order history
- Product image uploader for admins
- Search and filter improvements
- Coupon/promo code system

## 🗺️ Timeline

- **April 6–7 (Weekdays)**: Project setup, Flask API routes, DB setup, React structure
- **April 8–9 (Weekend)**: Core functionality (user auth, products, cart)
- **April 10–12**: API integrations (Cardknox + KD100), admin views
- **April 13–14**: UI polishing, deploy backend/frontend
- **April 15–16**: Buffer, testing, and final polish

## 📁 Database Schema

📌 View the live schema:  
👉 [https://dbdiagram.io/d/Sun-Kissed-and-Southern-67d1b7cf75d75cc844d787ff](https://dbdiagram.io/d/Sun-Kissed-and-Southern-67d1b7cf75d75cc844d787ff)

📸 Visual Schema:

![Database Schema](./assets/database-schema.png)

---

