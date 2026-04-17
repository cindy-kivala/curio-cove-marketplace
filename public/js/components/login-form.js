import { LitElement, html, css } from 'lit';

class LoginForm extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    username: { type: String },
    password: { type: String },
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
    this.isLoading = false;
  }

   connectedCallback() {
    super.connectedCallback();
    const base = this.getAttribute('api-base');
    if (base) this.apiBase = base;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.isLoading = true;
    this.error = '';
    
    try {
      const response = await fetch(`${this.apiBase}/users/login`, {
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
    } catch (err) {
      this.error = 'Network error - please try again';
  } finally {
    this.isLoading = false;
  }
}

render() {
    return html`
      <div class="container">
        <h2 class="text-2xl font-bold mb-4">Login to CurioCove 🏝️</h2>
        <p style="color:#6b7280; font-size:0.875rem; margin-bottom:1rem">
          New here? Just pick a username and password,an account will be created automatically.
        </p>
        <form @submit=${this.handleSubmit}>
          <input 
            type="text" 
            class="input-field"
            placeholder="Username"
            .value=${this.username}
            @input=${(e) => this.username = e.target.value}
            required
          >
          <input 
            type="password" 
            class="input-field"
            placeholder="Password"
            .value=${this.password}
            @input=${(e) => this.password = e.target.value}
            required
          >
          <button type="submit" class="btn" ?disabled=${this.isLoading}>
            ${this.isLoading ? 'Logging in...' : 'Login / Register'}
          </button>
          ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        </form>
      </div>
    `;
  }
}

customElements.define('login-form', LoginForm);
