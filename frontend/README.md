# 🌴 Sun-Kissed & Southern — Frontend

[![Live Site](https://img.shields.io/badge/Frontend-Netlify-blue?style=for-the-badge&logo=react)](https://sun-kissed-and-southern.netlify.app)

This is the **frontend for Sun-Kissed & Southern**, a full-stack ecommerce project built in React with Vite. It supports a mobile-first, polished shopping experience for a Florida-inspired lifestyle brand.

## 🧭 Features

- 🛍️ Product catalog with variants (size, color, image)
- 📦 Sale badges + real-time discount logic
- 🛒 Cart with localStorage (guest-friendly)
- 🧾 Checkout w/ Cardknox sandbox payment integration
- 🔐 Login + protected routes with JWT (localStorage persistence)
- 🧡 Favorite products (wishlist-style)
- 💬 Review system (with moderation)
- 📚 Blog with optional weather content
- 🧑‍💼 Admin dashboard tools:
  - Product & variant management
  - Order lifecycle: paid → fulfilled → shipped
  - Returns, refunds, inventory restock
  - Coupon + discount editor
  - Analytics dashboard

## 🖥️ Tech Stack

- **React (Vite + JSX)**
- **React Router** for navigation
- **Context API** for global state (auth, cart, favorites)
- **Scoped CSS** for modular styling
- **Axios** for API calls

## 📁 Project Structure

```txt
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── api/
│   └── styles/
├── public/
│   └── assets/
├── index.html
├── main.jsx
└── README.md
```

## 🔧 Local Setup

```bash
git clone https://github.com/danicacm17/sun-kissed-southern.git
cd sun-kissed-southern/frontend
npm install
npm run dev
```

Runs locally at:
👉 `http://localhost:5173`

## 🔐 Environment Setup

Create a `.env` file in the root of `frontend/` if needed:

```env
VITE_API_BASE_URL=http://localhost:5000
```

For production, this is handled by Netlify’s environment settings.

## 🧪 Testing

- Manual testing of all cart and checkout logic
- Favorite/variant handling confirmed on product modals
- Full admin and customer order lifecycle tested

## 🌐 Deployment

- **Frontend**: [Netlify](https://sun-kissed-and-southern.netlify.app)
- **Backend**: [Render](https://sun-kissed-backend.onrender.com)

## ✅ Project Status

- ✅ Production-ready
- ✅ Fully responsive
- ✅ Frontend/Backend integrated
- ✅ All features implemented and live

## 👤 Author

**Danica Murphy**  
GitHub: [@danicacm17](https://github.com/danicacm17)
