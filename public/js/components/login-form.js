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
      background: blue;
      color: white;
      border: none;
  `; 

  constructor() {
    super();
    this.username = '';
    this.password = '';
    this.error = '';
    this.isLoading = false;
  }
'
  async hanleSubmit(e) {
    e.preventDefault();
    this.isLoading = true;
    this.error = '';
    
    try {
      const response = await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: this.username, 
          password: this.password  
        })
      });
      
      if (response.ok) {
        const user = await response.json();
        this.onLoginSuccess(user);
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
}

customElements.define('login-form', LoginForm);
