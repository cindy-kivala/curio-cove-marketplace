import { LitElement, html, css } from 'lit';

class LoginForm extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    username: { type: String },
    password: { type: String },
    mode: { type: String },
    error: { type: String },
    isLoading: { type: Boolean }
  };

  static styles = css`
    .container {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .input-field {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 5px;
      box-sizing: border-box;
    }
    .btn {
      width: 100%;
      padding: 10px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn:disabled {
      background: #9ca3af;
    }    
      .error {
      color: red;
      margin-top: 10px;
    }
  `; 

  constructor() {
    super();
    this.username = '';
    this.password = '';
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
    <div class="container">
      <!-- Tab switcher -->
      <div style="display:flex; margin-bottom:20px; border-bottom:2px solid #e5e7eb;">
        <button
          @click=${() => { this.mode = 'login'; this.error = ''; }}
          style="flex:1; padding:10px; border:none; cursor:pointer; font-weight:600;
                 background:none;
                 border-bottom:${this.mode === 'login' ? '2px solid #3b82f6' : 'none'};
                 color:${this.mode === 'login' ? '#3b82f6' : '#6b7280'}">
          Login
        </button>
        <button
          @click=${() => { this.mode = 'register'; this.error = ''; }}
          style="flex:1; padding:10px; border:none; cursor:pointer; font-weight:600;
                 background:none;
                 border-bottom:${this.mode === 'register' ? '2px solid #3b82f6' : 'none'};
                 color:${this.mode === 'register' ? '#3b82f6' : '#6b7280'}">
          Register
        </button>
      </div>

      <h2 style="font-size:1.5rem; font-weight:700; margin-bottom:8px">
        ${this.mode === 'login' ? 'Welcome back 🏝️' : 'Create an account 🏝️'}
      </h2>

      <form @submit=${this.handleSubmit} autocomplete="off">
        <input
          type="text"
          class="input-field"
          placeholder="Username"
          autocomplete="off"
          .value=${this.username}
          @input=${(e) => this.username = e.target.value}
          required
        />
        <input
          type="password"
          class="input-field"
          placeholder="Password"
          autocomplete="new-password"
          .value=${this.password}
          @input=${(e) => this.password = e.target.value}
          required
        />
        <button type="submit" class="btn" ?disabled=${this.isLoading}>
          ${this.isLoading 
            ? 'Please wait...' 
            : this.mode === 'login' ? 'Login' : 'Create Account'}
        </button>
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
      </form>
    </div>
  `;
}
}

customElements.define('login-form', LoginForm);
