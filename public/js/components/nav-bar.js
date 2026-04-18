import { LitElement, html, css } from 'lit';

class NavBar extends LitElement {
    static properties = {
        apiBase: { type: String },
        currentUser: { type: Object, state: true }
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
    `;

    constructor() {
        super();
        this.currentUser = null;
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
    }


    goTo(path) {
        window.location.href = path;
    }

    logout() {
        localStorage.removeItem('curioCoveUser');
        window.location.href = '/login';
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
                            <a @click=${() => this.goTo('/')}>Browse</a>
                            <a @click=${() => this.goTo('/dashboard')}>My Listings</a>
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
