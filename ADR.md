# Architecture Decision Records (ADR)

**Project:** CurioCove Marketplace  
**Date:** April 17, 2026  
**Author:** Cindy Kivala

---

## ADR 001: HTTP Polling over WebSockets for Real-time Chat

### Context
The assessment required a direct messaging system between buyers and sellers for each item. The provided backend API supported HTTP polling endpoints (`/api/messages/item/:itemId/poll/:timestamp`) but did not include WebSocket support. I needed to choose a real-time communication strategy that works with the existing backend.

### Options Considered

| Option | Description | Complexity |
|--------|-------------|------------|
| **WebSockets (Socket.io)** | Bidirectional, event-driven communication | High - requires new server setup |
| **Server-Sent Events (SSE)** | One-way server to client streaming | Medium - unidirectional only |
| **HTTP Long Polling** | Server holds request until new data | Medium - requires server changes |
| **HTTP Short Polling (chosen)** | Client requests at fixed intervals | Low - works with existing API |

### Decision
**Use HTTP Short Polling with 2-second intervals.**

### Trade-offs

| Pros | Cons |
|------|------|
| No additional dependencies | Up to 2 seconds message delay |
| Works with provided backend API | More HTTP requests (server load) |
| Simple to implement | Less efficient than WebSockets |
| No server configuration needed | Battery drain on mobile devices |

### Rationale
The provided backend already had polling endpoints implemented. Given the assessment deadline and the fact that real-time wasn't strictly required, HTTP polling was the pragmatic choice.

---

## ADR 002: Multi-Page Architecture with EJS Shells and Lit Components

### Context
The assessment explicitly specified: *"EJS for server-side rendering of the page shell • Lit (JavaScript) for client-side interactive components"*and *"The server decides which Lit components to render"*.

### Options Considered

| Option | Server decides components? | Assessment compliant? |
|--------|--------------------------|----------------------|
| **Full EJS rendering** | Yes | No Lit components |
| **Single Page App (app-shell.js)** | No — JS decides in browser | Partial |
| **Multi-Page EJS + Lit (chosen)** | Yes | Fully compliant |

### Decision
**Use a separate EJS template per route, each loading only the Lit components that page needs.**

Each route is a deliberate server decision:

| Route | EJS Template | Lit Components Loaded |
|-------|-------------|----------------------|
| `GET /` | `index.ejs` | `nav-bar`, `item-grid` |
| `GET /item/:id` | `item.ejs` | `nav-bar`, `item-detail`, `chat-panel` |
| `GET /login` | `login.ejs` | `login-form` |
| `GET /dashboard` | `dashboard.ejs` | `nav-bar`, `seller-dashboard` |

### Trade-offs

| Pros | Cons |
|------|------|
| Server controls component composition | Full page reload on navigation |
| Each page is independently loadable | No shared in-memory state between pages |
| Clean separation of concerns | localStorage needed for auth persistence |
| Directly matches assessment requirement | |

### Rationale
A single `app-shell.js` approach was initially considered but rejected because it moves the component rendering decision to the browser, bypassing EJS entirely. The MPA approach ensures the server genuinely decides what renders on each page.

---

## ADR 003: LocalStorage for Authentication State

### Context
The backend uses sessionless authentication - no JWT or session cookies. I needed a way to persist login state across page refreshes.

### Options Considered

| Option | Persistence | Security | Complexity |
|--------|-------------|----------|------------|
| **No storage** | None | High | Low |
| **Session Storage** | Tab only | Medium | Low |
| **Local Storage (chosen)** | Persistent across sessions | Medium | Low |
| **HTTP-only Cookies** | Configurable | High | High |

### Decision
**Store authenticated user object in localStorage after login, clear on logout.**

### Trade-offs

| Pros | Cons |
|------|------|
| Simple to implement | XSS vulnerability risk |
| Persists across page refreshes | User can manually modify data |
| No backend changes needed | No automatic expiration |

### Rationale
For a marketplace prototype with manual payment confirmation, localStorage provides adequate security while delivering a smooth user experience.

---

## ADR 004: File-based JSON Storage over Database

### Context
The provided backend used JSON files for storage. I needed to decide whether to keep this or migrate to a database.

### Decision
**Keep the file-based JSON storage as provided.**

### Trade-offs

| Pros | Cons |
|------|------|
| Zero additional setup | Not scalable |
| Works immediately | No query capabilities |
| Easy to debug | Race conditions possible |
| Matches assessment starter | No data validation |

### Rationale
For an assessment prototype, simplicity and speed outweigh scalability concerns. JSON files work perfectly for the expected scale.

**Important:** JSON files are excluded from git via `.gitignore`:
data/*.json
!data/.gitkeep

**Production note:** On Render, the filesystem is ephemeral between deploys.
JSON data files are stored on a persistent Render Disk mounted at `/data`.
Path resolution switches based on `NODE_ENV`:
```js
const itemsPath = process.env.NODE_ENV === 'production'
  ? '/data/items.json'
  : join(__dirname, '../data/items.json');
```


---

## ADR 005: Local Lit Bundle over CDN

### Context
Lit components require the Lit library to be available in the browser. The initial approach used a CDN URL, but this caused 404 errors because the specific CDN file path (`lit-all.min.js`) does not exist, and CDN availability is unreliable in all environments.

### Options Considered

| Option | Reliability | Build step | Works offline? |
|--------|-------------|-----------|----------------|
| **jsdelivr CDN** | Unreliable — file not found | None | No |
| **unpkg CDN** | Unreliable in some regions | None | No |
| **Local bundle (chosen)** | Always available | One-time rollup build | Yes |

### Decision
**Bundle Lit into a single ES module file (`public/js/lit-bundle.min.js`) using Rollup, and serve it from the application itself.**

The importmap in each EJS file maps all Lit imports to this local file:

```html
<script type="importmap">
{
    "imports": {
        "lit": "/js/lit-bundle.min.js",
        "lit-html": "/js/lit-bundle.min.js",
        "lit-element": "/js/lit-bundle.min.js"
    }
}
</script>

### ADR 006: UTC Timezone with Client-side Offset

### Context
Timestamps were showing UTC time (5:25) instead of local East Africa Time (8:25). I needed to decide where to fix this.

### Options Considered

| Option | Approach |
|--------|----------|
| **Change database to local time** | Modify timestamps before saving |
| **Fix existing timestamps** | Update JSON file data |
| **Client-side offset (chosen)** | Add 3 hours in display only |

### Decision
**Keep UTC in database, add 3-hour offset in the UI display.**

### Trade-offs

| Pros | Cons |
|------|------|
| Standard industry practice | Requires code change |
| Works for any timezone | Offset hardcoded (+3) |
| No data corruption | |
| Future messages auto-fixed | |

### Implementation
```javascript
formatTime(timestamp) {
  const date = new Date(timestamp);
  date.setHours(date.getHours() + 3); // UTC+3 for East Africa
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

## ADR 007: Per-listing Chat over Private Messaging

### Decision
Chat is scoped per item listing, visible to all participants, 
modelled after Facebook Marketplace and OLX rather than 
private direct messaging.

### Rationale
The assessment specifies messaging "for each item" which maps 
directly to a per-listing thread. Private per-user threads would 
require additional backend endpoints, inbox UI, and conversation 
management outside the assessment scope.

## ADR 008: Dashboard-level Offer Accept/Reject over Chat-only

### Context
Initially, offer accept/reject was only possible inside the chat panel per item.
Sellers needed a way to manage all offers from a single dashboard view.

### Decision
**Expose Accept/Reject controls directly on each listing card in the seller dashboard.**

When a seller accepts an offer, all other pending offers on that item are automatically
rejected, and the item status is set to `sold` immediately — bypassing the checkout flow.

### Trade-offs

| Pros | Cons |
|------|------|
| Single place to manage all offers | Duplicates logic from chat panel |
| Faster workflow for active sellers | Two code paths to maintain |
| Prevents double-acceptance | |

## ADR 009: Soft Sold Status over Hard Delete

### Context
Originally, confirming a sale deleted the item from `items.json` entirely.
This caused sold items to vanish from the seller dashboard and prevented
buyers from seeing their purchase history.

### Decision
**Mark items as `status: 'sold'` instead of deleting them.**

Items with `status: 'sold'` are excluded from the public marketplace
(`GET /api/items` filters for `status === 'active'`) but remain accessible
via `GET /api/items/all?sellerId=` for the seller dashboard and via
`GET /api/users/:id/purchases` for buyer history.

### Trade-offs

| Pros | Cons |
|------|------|
| Preserves purchase history | JSON file grows over time |
| Seller can see sold items | Slightly more complex filtering |
| Enables seller ratings post-sale | |

## Current Project Status

### Completed Features
- User login/registration with password hashing and localStorage persistence
- Browse items with live search and keyword highlighting
- Category filter pills on marketplace grid
- Item condition and category badges on listings
- View single item details with offer history
- Make offers on items with 24-hour auto-expiry
- Real-time chat with HTTP polling every 2 seconds
- Typing indicator in chat
- Unread message badge on nav bar with 10-second polling
- Seller dashboard — create, edit, delete listings
- Accept/reject offers directly from dashboard
- Buyer checkout (confirms payment)
- Seller confirms sale — item marked as sold
- Sold item protection — no offers or purchases on sold items
- Buyer purchases collection tab
- Seller ratings (1–5 stars) from buyers after purchase
- Image URL preview in create listing form
- Empty state improvements across grid, dashboard, and chat
- Mobile responsive layout on all views
- SEO-optimised page titles and meta tags per route

Project Structure
text
curio-cove-marketplace/
├── index.js                 # Express server with EJS
├── package.json
├── tailwind.config.js
├── .gitignore
├── ADR.md
├── README.md
├── data/                   # JSON storage (gitignored)
│   ├── .gitkeep
│   ├── items.json
│   ├── users.json
│   └── messages.json
├── routes/
│   ├── items.js           # CRUD, offers, checkout
│   ├── messages.js        # Auth
│   └── users.js           # Chat, polling
├── views/
│   └── dashboards.ejs
│   ├── item.ejs   
│   ├── layout.ejs         
│   └── login.ejs 
├── src/types
│   └── uuid.d.ts
└── public/
    ├── css/
    │   └── input.css
    │   └── styles.css
    |
    └── js/components/
        |    ├── app-shell.js
        |    ├── login-form.js
        |    ├── item-grid.js
        |    ├── item-detail.js
        |    └── chat-panel.js
        └──  lit-bundle.min.js

### Future Improvements
- Replace HTTP polling with WebSockets

- Add proper database (PostgreSQL)

- Implement JWT with HTTP-only cookies

- Add image upload functionality

- Convert to TypeScript (bonus requirement)

- Add unit tests

- Implement proper Tailwind build process with PurgeCSS


