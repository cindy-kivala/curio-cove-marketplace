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

## ADR 002: Hybrid Rendering (EJS Shell + Lit Components)

### Context
The assessment explicitly specified: *"EJS for server-side rendering of the page shell • Lit (JavaScript) for client-side interactive components"*.

### Options Considered

| Option | Assessment Compliant? |
|--------|----------------------|
| **Full EJS Rendering** | No Lit components |
| **Full Client-Side Lit** | No EJS shell |
| **Hybrid (chosen)** |  Yes |

### Decision
**Use EJS to render the basic HTML shell and let a root Lit component (`<app-shell>`) manage all interactive content.**

### Trade-offs

| Pros | Cons |
|------|------|
| Follows assessment exactly | Two rendering paradigms to manage |
| Fast initial page load | State must pass between layers |
| SEO-friendly | Slightly more complex data flow |

### File Structure
views/layout.ejs # Server-rendered shell
public/js/components/
├── app-shell.js # Root Lit component
├── login-form.js # Authentication UI
├── item-grid.js # Browse items
├── item-detail.js # Single item view
├── chat-panel.js # Messaging with polling
└── seller-dashboard.js # Seller management (coming)

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


---

## ADR 005: Tailwind CSS CDN over Build Process

### Context
The assessment required Tailwind CSS for styling.

### Decision
**Use Tailwind CSS CDN for development.**

### Trade-offs

| Pros | Cons |
|------|------|
| Instant setup | No custom configuration |
| No build step needed | Larger bundle size |
| Easy to iterate | No purging |

### Implementation
```html
<script src="https://cdn.tailwindcss.com"></script>

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

## Current Project Status
# Completed Features
- User login/registration (with password hashing)

- Browse items with search

- View single item details

- Make offers on items

- Real-time chat (HTTP polling every 2 seconds)

- Checkout (buyer confirms payment)

- Seller confirms sale (removes item)

# Pending Features
- Seller dashboard (manage listings)

- Message inbox (unread notifications)

Project Structure
text
curio-cove-marketplace/
├── index.js                 # Express server with EJS
├── package.json
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
│   ├── users.js           # Auth
│   └── messages.js        # Chat, polling
├── views/
│   └── layout.ejs
└── public/
    ├── css/
    │   └── styles.css
    └── js/components/
        ├── app-shell.js
        ├── login-form.js
        ├── item-grid.js
        ├── item-detail.js
        └── chat-panel.js

### Future Improvements
- Replace HTTP polling with WebSockets

- Add proper database (PostgreSQL)

- Implement JWT with HTTP-only cookies

- Add image upload functionality

- Convert to TypeScript (bonus requirement)

- Add unit tests

- Implement proper Tailwind build process with PurgeCSS

