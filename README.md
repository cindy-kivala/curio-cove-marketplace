# CurioCove 🏝️

A peer-to-peer collectibles marketplace where buyers and sellers discover rare items, negotiate prices, and trade with confidence.

**Live Demo:** https://curio-cove-marketplace-production.up.railway.app/ 
**Repository:** https://github.com/cindy-kivala/curio-cove-marketplace

---
## Test Accounts

Use these accounts to explore the full user journey:

| Username | Password | Role |
|----------|----------|------|
| PepperAnn | lilpeppie | Top seller with active listings and customer ratings |
| Clover | beverly313 | Buyer with offer history as well as seller with active listings |
| Nicky Little | Kamalani | Seller with active listings |
| Ansel | &Gretel | Seller with active listings |

> Or register a new account to test the full signup flow.

---

## User Journey

### As a Buyer
1. Visit the marketplace and browse items by category or search by keyword
2. Click any item to view details
3. Login/Register then Click **Buy Now** to purchase at listed price, or enter an offer amount and click **Submit Offer**
4. Chat with the seller using the **Message Seller** button
5. Once seller accepts your offer, go to the item and confirm payment
6. View your purchased items under **Dashboard → Purchases**
7. Rate the seller after purchase

### As a Seller
1. Register or log in → click **Listings** in the nav
2. Click **+ New Listing** to create a listing with condition and category
3. When a buyer makes an offer, click **Review Offer** on your listing card
4. Click **Accept** to sell at offer price or **Reject** to decline
5. If a buyer pays via Buy Now, click **Confirm Sale** to complete the transaction
6. View sold items in your dashboard — they remain visible with a Sold badge

### To test chat
1. Open the app in two different browsers (or normal + incognito)
2. Log in as different users
3. Open the same item and use Message Seller — messages appear in real time

## Screenshots

> Homepage — item grid with category filters  
> Item detail — offer form, chat, offer history  
> Seller dashboard — listings, offer management, purchases, ratings

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express |
| Templating | EJS (server-side page shells) |
| Components | Lit Web Components |
| Styling | Tailwind CSS + custom CSS variables |
| Storage | JSON flat files |
| Deployment | Railway |

---

## Architecture

This project uses a **Multi-Page Architecture** where the server decides which Lit components to render on each page — directly satisfying the assessment requirement that *"the server decides which Lit components to render."*

| Route | EJS Shell | Components |
|-------|-----------|------------|
| `GET /` | `index.ejs` | `nav-bar`, `item-grid` |
| `GET /item/:id` | `item.ejs` | `nav-bar`, `item-detail`, `chat-panel` |
| `GET /login` | `login.ejs` | `login-form` |
| `GET /dashboard` | `dashboard.ejs` | `nav-bar`, `seller-dashboard` |

---

## Features

### Marketplace
- Browse collectible items across 8 categories
- Live keyword search with match highlighting
- Category filter pills (Comics & Cards, Jewelry, Art & Memorabilia, etc.)
- Item condition and category badges
- Status indicators — Offer Pending, Payment Confirmed, Sold

### Buying
- Make price offers on any active listing
- Offer history with accepted/rejected/expired status
- 24-hour offer auto-expiry
- Buy Now with inline confirmation
- Buyer checkout — confirms payment to seller
- Purchases collection tab in dashboard
- Rate sellers after purchase (1–5 stars)

### Selling
- Create listings with name, price, description, image URL, condition, category
- Live image URL preview on create form
- Accept or reject offers directly from dashboard
- Accepting an offer auto-rejects all other pending offers
- Confirm sale after buyer payment
- Sold items preserved in dashboard history

### Chat
- Real-time messaging per item listing (HTTP polling, 2s interval)
- Offer messages with accept/reject controls for sellers
- Typing indicator
- Unread message badge on nav bar (10s polling)
- Mark as read when chat is opened

### Auth
- Register and login with password hashing (SHA-256)
- Persistent session via localStorage
- Seller blocked from buying their own items

---

## Setup
git clone https://github.com/cindy-kivala/curio-cove-marketplace.git
cd curio-cove-marketplace
npm install
npm start


Visit `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List active items (supports `?search=`) |
| GET | `/api/items/all` | All items for a seller (`?sellerId=`) |
| GET | `/api/items/:id` | Single item |
| POST | `/api/items` | Create listing |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete listing |
| POST | `/api/items/:id/checkout` | Buyer confirms payment |
| POST | `/api/items/:id/confirm-sale` | Seller confirms sale |
| GET | `/api/messages/item/:id/poll/:since` | Poll for new messages |
| GET | `/api/messages/unread/:userId` | Unread message count |
| POST | `/api/messages` | Send message |
| PUT | `/api/messages/:id` | Update message status |
| POST | `/api/messages/read` | Mark messages as read |
| POST | `/api/users/login` | Login |
| POST | `/api/users/register` | Register |
| GET | `/api/users/:id/purchases` | Buyer purchase history |
| POST | `/api/users/:id/rate` | Rate a seller |

---

## Project Structure
curio-cove-marketplace/
├── index.js                 # Express server + EJS routing
├── package.json
├── ADR.md                   # Architecture Decision Records
├── README.md
├── data/
│   ├── items.json
│   ├── users.json
│   └── messages.json
├── routes/
│   ├── items.js             # CRUD, offers, checkout, confirm-sale
│   ├── users.js             # Auth, purchases, ratings
│   └── messages.js          # Chat, polling, unread counts
├── views/
│   ├── index.ejs
│   ├── item.ejs
│   ├── dashboard.ejs
│   └── login.ejs
└── public/
├── css/
│   └── styles.css
└── js/
├── lit-bundle.min.js
└── components/
├── nav-bar.js
├── login-form.js
├── item-grid.js
├── item-detail.js
├── chat-panel.js
└── seller-dashboard.js

---

## Author

Cindy Kivala