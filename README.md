# Sun-Kissed & Southern ☀️🌴

Welcome to **Sun-Kissed & Southern**, my full-stack capstone project for Springboard — a beach lifestyle ecommerce store inspired by the Florida coast. This app is built to simulate a production-grade shopping experience, including real APIs, admin tools, and responsive frontend design.

## 🛍️ Features

- Browse and filter products by category
- Select variants (color, size) and view sale prices
- Favorite products (for logged-in users)
- Guest-friendly cart with persistent localStorage
- Coupon codes and dynamic sales
- Secure checkout using **Cardknox API (sandbox)**
- Order tracking via **KeyDelivery (sandbox)**
- Admin dashboard to manage:
  - Products & variants
  - Orders & returns
  - Fulfillment flow (paid → fulfilled → shipped)
  - Analytics and inventory alerts
- Lifestyle blog with optional weather content

## 🧰 Tech Stack

**Frontend**  
- React (Vite)  
- React Router, Context API  
- CSS Modules for scoped styling  

**Backend**  
- Python Flask (REST API)  
- PostgreSQL (via SQLAlchemy)  
- JWT authentication  
- Flask-Migrate, Marshmallow for schema validation  

**APIs Used**  
- [Cardknox Sandbox](https://developer.cardknox.com/) — payment processing  
- [KeyDelivery API](https://www.kd100.com/en/) — order tracking  
- [OpenWeatherMap](https://openweathermap.org/api) *(optional for blog)*

## 🗺️ Architecture

- Frontend and backend are separated, each deployed independently
- Backend hosted via Render (or Railway)
- Frontend hosted via Netlify (or Vercel)
- Environment variables used to protect API keys

## 📦 Database Schema

You can view the updated schema in [`assets/database-schema.png`](assets/database-schema.png)  
Or on [dbdiagram.io](https://dbdiagram.io/):  
➡️ `https://dbdiagram.io/d/Sun-Kissed-and-Southern-67d1b7cf75d75cc844d787ff`

## ✅ Status

🟢 **In final testing & polish phase**  
✅ Full checkout flow and admin panel complete  
✅ Sales, coupons, and review system fully functional  
🧪 Actively testing edge cases before deployment

## 📄 Project Proposal

You can view the full [PROJECT_PROPOSAL.md](PROJECT_PROPOSAL.md) for detailed feature scope, timeline, and architecture notes.
