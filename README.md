# 🏠 Real Estate Platform

[![Backend](https://img.shields.io/badge/Backend-Node.js-green)](https://nodejs.org/)  
[![Frontend](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)  
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blueviolet)](https://www.postgresql.org/)  
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A **full-featured Real Estate platform** built with **Express.js + Prisma** (backend) and **React.js + Vite** (frontend) 🌐🚀  

_Built with ❤️ by [Shehab Elbana]_

---

## ✨ Features Overview

### 🔐 Authentication & Users
- 👤 User registration & login (**JWT Authentication**)  
- ✏️ Update profile (name, email, avatar)  
- ❌ Delete account  
- 📑 Get all users  
- 👥 Follow / connect with other users (optional for chat)  

### 🏡 Properties / Posts
- ➕ Create, update, delete property posts (text + images)  
- 📄 View single/all property posts (pagination + filters)  
- 💾 Save / unsave favorite properties  
- 📑 View properties by user  

### 💬 Chat
- 🔄 Real-time chat between users via **Socket.io**  
- ✅ Mark messages as seen  
- 💬 View chat history  

### 📍 Map Integration
- 🌐 Property location displayed on **Leaflet map**  
- 🔍 Filter properties by location  

---

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js  
- Prisma ORM + PostgreSQL  
- JWT Authentication  
- Bcrypt → password hashing  
- Helmet + CORS + rate limiting → security  

### Frontend
- React.js + Vite  
- Axios → API calls  
- React Context → authentication state  
- React Router → navigation  
- SCSS → responsive UI  
- Leaflet → maps for properties  

### Realtime
- Socket.io → chat system  

---

## 💡 Notes
- JWT token is stored in **httpOnly cookies**, no manual localStorage for tokens  
- Users auto-login if cookie is valid  
- Property posts can include images uploaded to Cloudinary (or similar service)  
- Protected routes require authentication  

---

## 🎨 Badges
[![React](https://img.shields.io/badge/React-19.2.4-blue)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-20.0.0-green)](https://nodejs.org/)  
[![Express](https://img.shields.io/badge/Express-5.2.1-lightgrey)](https://expressjs.com/)  
[![Prisma](https://img.shields.io/badge/Prisma-6.19.0-blue)](https://www.prisma.io/)  
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blueviolet)](https://www.postgresql.org/)  
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-black)](https://socket.io/)
