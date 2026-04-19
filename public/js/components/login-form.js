import { LitElement, html, css } from 'lit';

class LoginForm extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    username: { type: String },
    password: { type: String },
    location: { type: String },
    phone: { type: String },
    mode: { type: String },
    error: { type: String },
    isLoading: { type: Boolean }
  };

  static styles = css`
    :host { display: block; }
    nav {
      background: #ffffff;
      border-bottom: 1px solid #e8e4de;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .container {
      max-width: 1280px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.4rem;
      font-weight: 700;
      cursor: pointer;
      color: #1a1a1a;
      letter-spacing: -0.01em;
    }
    .logo span { color: #c9a96e; }
    .nav-links {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    a {
      cursor: pointer;
      text-decoration: none;
      color: #6b6b6b;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      transition: color 0.15s;
    }
    a:hover { color: #1a1a1a; }
    .username {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1a1a;
      padding: 0 4px;
    }
    .logout-btn {
      background: transparent;
      border: 1px solid #e8e4de;
      color: #6b6b6b;
      padding: 6px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.15s;
    }
    .logout-btn:hover {
      border-color: #c0392b;
      color: #c0392b;
    }
    .badge-dot {
      position: absolute;
      top: -6px;
      right: -10px;
      background: #c9a96e;
      color: white;
      border-radius: 9999px;
      font-size: 0.6rem;
      padding: 1px 5px;
      font-weight: 700;
    }
    @media (max-width: 640px) {
      .browse-link { display: none; }
      nav { padding: 0 16px; }
    }
  `;

  constructor() {
    super();
    this.username = '';
    this.password = '';
    this.location = '';
    this.phone = '';
    this.error = '';
    this.mode = 'login';
    this.isLoading = false;
  }

   connectedCallback() {
    super.connectedCallback();
    const base = this.getAttribute('api-base');
    if (base) this.apiBase = base;

    // If already logged in, skip the login page entirely
    const stored = localStorage.getItem('curioCoveUser');
    if (stored) window.location.href = '/';
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.isLoading = true;
    this.error = '';
    
    try {
      const endpoint = this.mode === 'login'
        ? `${this.apiBase}/users/login`
        : `${this.apiBase}/users/register`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: this.username, 
          password: this.password  
        })
      });
      
      if (response.ok) {
        const user = await response.json();
        // MPA FIX: save user and redirect-no custom event needed
        localStorage.setItem('curioCoveUser', JSON.stringify(user));
        window.location.href = '/';
      } else {
        const data = await response.json();
        this.error = data.error || 'Login failed';
      }
    } catch {
      this.error = 'Network error - please try again';
  } finally {
    this.isLoading = false;
  }
}

render() {
  return html`
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf9f7;padding:24px">
      <div style="width:100%;max-width:420px">

        <!-- Logo -->
        <div style="text-align:center;margin-bottom:40px">
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:700;color:#1a1a1a">
            Curio<span style="color:#c9a96e">Cove</span>
          </h1>
          <p style="color:#6b6b6b;font-size:0.875rem;margin-top:6px">The Collector's Marketplace</p>
        </div>

        <!-- Card -->
        <div style="background:white;border-radius:16px;padding:36px;border:1px solid #e8e4de;box-shadow:0 4px 24px rgba(0,0,0,0.06)">

          <!-- Tabs -->
          <div style="display:flex;margin-bottom:28px;border-bottom:1px solid #e8e4de">
            <button @click=${() => { this.mode = 'login'; this.error = ''; }}
              style="flex:1;padding:10px;border:none;cursor:pointer;font-weight:600;font-size:0.875rem;
                background:none;
                border-bottom:${this.mode === 'login' ? '2px solid #c9a96e' : '2px solid transparent'};
                color:${this.mode === 'login' ? '#1a1a1a' : '#6b6b6b'};
                margin-bottom:-1px;transition:all 0.15s">
              Sign In
            </button>
            <button @click=${() => { this.mode = 'register'; this.error = ''; }}
              style="flex:1;padding:10px;border:none;cursor:pointer;font-weight:600;font-size:0.875rem;
                background:none;
                border-bottom:${this.mode === 'register' ? '2px solid #c9a96e' : '2px solid transparent'};
                color:${this.mode === 'register' ? '#1a1a1a' : '#6b6b6b'};
                margin-bottom:-1px;transition:all 0.15s">
              Create Account
            </button>
          </div>

          <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:1.4rem;font-weight:600;color:#1a1a1a;margin-bottom:24px">
            ${this.mode === 'login' ? 'Welcome back' : 'Join CurioCove'}
          </h2>

          <form @submit=${this.handleSubmit} autocomplete="off">
            <div style="margin-bottom:16px">
              <label style="display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b6b6b;margin-bottom:6px">
                Username
              </label>
              <input type="text"
                style="width:100%;padding:11px 14px;border:1px solid #e8e4de;border-radius:8px;font-size:0.95rem;background:#faf9f7;color:#1a1a1a;box-sizing:border-box;font-family:'Inter',sans-serif"
                placeholder="Enter your username"
                autocomplete="off"
                .value=${this.username}
                @input=${(e) => this.username = e.target.value}
                required />
            </div>

            <div style="margin-bottom:${this.mode === 'register' ? '16px' : '24px'}">
              <label style="display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b6b6b;margin-bottom:6px">
                Password
              </label>
              <input type="password"
                style="width:100%;padding:11px 14px;border:1px solid #e8e4de;border-radius:8px;font-size:0.95rem;background:#faf9f7;color:#1a1a1a;box-sizing:border-box;font-family:'Inter',sans-serif"
                placeholder="Enter your password"
                autocomplete="new-password"
                .value=${this.password}
                @input=${(e) => this.password = e.target.value}
                required />
            </div>

            ${this.mode === 'register' ? html`
              <div style="margin-bottom:16px">
                <label style="display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b6b6b;margin-bottom:6px">
                  Location
                </label>
                <input type="text"
                  style="width:100%;padding:11px 14px;border:1px solid #e8e4de;border-radius:8px;font-size:0.95rem;background:#faf9f7;color:#1a1a1a;box-sizing:border-box;font-family:'Inter',sans-serif"
                  placeholder="e.g. Nairobi, Kenya"
                  .value=${this.location || ''}
                  @input=${(e) => this.location = e.target.value} />
              </div>
              <div style="margin-bottom:24px">
                <label style="display:block;font-size:0.72rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6b6b6b;margin-bottom:6px">
                  Phone <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span>
                </label>
                <input type="tel"
                  style="width:100%;padding:11px 14px;border:1px solid #e8e4de;border-radius:8px;font-size:0.95rem;background:#faf9f7;color:#1a1a1a;box-sizing:border-box;font-family:'Inter',sans-serif"
                  placeholder="+254 700 000 000"
                  .value=${this.phone || ''}
                  @input=${(e) => this.phone = e.target.value} />
              </div>
            ` : ''}

            <button type="submit"
              style="width:100%;padding:12px;background:#1a1a1a;color:white;border:none;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.15s"
              ?disabled=${this.isLoading}>
              ${this.isLoading ? 'Please wait...' : this.mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            ${this.error ? html`
              <div style="margin-top:14px;padding:10px 14px;background:#fef2f2;border-radius:8px;color:#c0392b;font-size:0.875rem">
                ${this.error}
              </div>
            ` : ''}
          </form>
        </div>

        <p style="text-align:center;margin-top:20px;font-size:0.8rem;color:#6b6b6b">
          Rare finds. Fair prices. Trusted trades.
        </p>
      </div>
    </div>
  `;
}
}

customElements.define('login-form', LoginForm);
