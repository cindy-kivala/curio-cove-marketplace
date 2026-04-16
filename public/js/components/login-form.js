import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/index.js';

class LoginForm extends LitElement {
  static properties = {
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
    }
    .btn {
      width: 100%;
      padding: 10px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
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

  async handleSubmit(e) {
    e.preventDefault();
    this.isLoading = true;
    this.error = '';
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: this.username, 
          password: this.password  
        })
      });
      
      if (response.ok) {
        const user = await response.json();
        this.dispatchEvent(new CustomEvent('login-success', { detail: user }));
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
        <h2 class="text-2xl font-bold mb-4">Login to CurioCove</h2>
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
