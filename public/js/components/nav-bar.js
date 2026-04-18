import { LitElement, html, css } from 'lit';

class NavBar extends LitElement {
    static properties = {
        apiBase: { type: String },
        currentUser: { type: Object, state: true },
        unreadCount: { type: Number }
    };

    static styles = css`
        nav {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 1rem;
        }
        .container {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
        }
        .nav-links {
            display: flex;
            gap: 1.5rem;
            align-items: center;
            flex-wrap: wrap;
        }
        a {
            cursor: pointer;
            text-decoration: none;
            color: #4b5563;
        }
        a:hover {
            color: #3b82f6;
        }
        .logout-btn {
            background: #ef4444;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem;
            border: none;
            cursor: pointer;
        }
        @media (max-width: 640px) {
          .browse-link, .listings-link { display: none; }
    }
    `;

    constructor() {
        super();
        this.currentUser = null;
        this.unreadCount = 0;
        this._pollInterval = null;
    }

    connectedCallback() {
        super.connectedCallback();

        // 1. Try the EJS attribute first (will be empty string since server passes null)
        const userAttr = this.getAttribute('current-user');
        if (userAttr && userAttr !== '') {
            try {
                this.currentUser = JSON.parse(userAttr);
            } catch {}
        }

        // 2. Fall back to localStorage — this is where login-form.js saves the user
        if (!this.currentUser) {
            const stored = localStorage.getItem('curioCoveUser');
            if (stored) {
                try { this.currentUser = JSON.parse(stored); } catch {}
            }
        }

        if (this.currentUser) {
          this._fetchUnreadCount();
          this._pollInterval = setInterval(() => this._fetchUnreadCount(), 10000);

          if (window.location.pathname === '/dashboard') {
            this.unreadCount = 0;
          }
        }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._pollInterval) clearInterval(this._pollInterval);
    }


    goTo(path) {
        window.location.href = path;
    }

    logout() {
        localStorage.removeItem('curioCoveUser');
        window.location.href = '/login';
    }

    async _fetchUnreadCount() {
    try {
        const base = this.apiBase || this.getAttribute('api-base') || '/api';
        const res = await fetch(`${base}/messages/unread/${this.currentUser.id}`);
        if (res.ok) {
        const data = await res.json();
        this.unreadCount = data.total || 0;
        }
    } catch {}
    }

    render() {
        return html`
            <nav>
                <div class="container">
                    <div class="logo" @click=${() => this.goTo('/')}>
                        🏝️ CurioCove
                    </div>
                    <div class="nav-links">
                        ${this.currentUser ? html`
                            <a class="browse-link" @click=${() => this.goTo('/')}>Browse</a>
                            <a class="listings-link" @click=${() => this.goTo('/dashboard')} style="position:relative">
                            <a @click=${() => this.goTo('/dashboard')} style="position:relative">
                              My Listings
                              ${this.unreadCount > 0 ? html`
                                <span style="
                                  position:absolute; top:-8px; right:-14px;
                                  background:#ef4444; color:white;
                                  border-radius:9999px; font-size:0.65rem;
                                  padding:1px 5px; font-weight:700;
                                ">${this.unreadCount}</span>
                                ` : ''}
                            </a>
                            <span class="username">${this.currentUser.name}</span>
                            <button class="logout-btn" @click=${this.logout}>Logout</button>
                        ` : html`
                            <a @click=${() => this.goTo('/login')}>Login</a>
                        `}
                    </div>
                </div>
            </nav>
        `;
    }
}

customElements.define('nav-bar', NavBar);
