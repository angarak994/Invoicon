# Invoicon 🚀

> A beautiful, modern, and agent-driven Invoice Generation SaaS.

Invoicon is a premium full-stack application designed to help businesses and freelancers generate, manage, and track professional invoices. Built with modern web technologies and featuring dynamically adaptive template designs, Invoicon ensures that your brand always looks flawless on paper (and PDF).

## ✨ Features

- **Dynamic Template Engine**: 9 unique, industry-specific templates (Standard, Retail, Restaurant, Rental, Construction, Professional, Creative, Startup, Elegant).
- **Intelligent Theming**: The application and PDF templates automatically adapt to your chosen brand color scheme.
- **Custom Data Fields**: Inject custom metadata (PO Numbers, VAT IDs, Table Numbers) into your invoices with perfect layout integration.
- **Digital Signatures**: Draw, type (with custom fonts), or upload a signature directly onto the generated document.
- **Automated Calculations**: Instant calculation of Subtotals, Taxes, Flat/Percentage Discounts, and Totals.
- **Export & Share**: Generate pixel-perfect PDFs or share directly via Email and WhatsApp.
- **Secure Authentication**: Robust JWT-based authentication system to manage user sessions safely.

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: Tailwind CSS & Vanilla CSS for premium aesthetic control
- **Icons**: Lucide React

### Backend
- **Framework**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ORM
- **PDF Generation**: Puppeteer
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **Validation**: Zod

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string

### 1. Clone the repository
```bash
git clone https://github.com/angarak994/Invoicon.git
cd Invoicon
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Rename `.env.example` to `.env` and fill in your MongoDB URI and JWT secrets.
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Rename `.env.example` to `.env.local` to connect to your local backend.
```bash
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:3000` to start creating invoices!

## 📝 License
This project is proprietary and confidential.
