import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/index.js';

class AppShell extends LitElement {
  static properties = {
    currentUser: { type: Object, state: true },
    currentView: { type: String, state: true },
    isLoading: { type: Boolean, state: true },
    selectedItemId: { type: String, state: true }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    .nav-link {
      cursor: pointer;
    }
    .nav-link:hover {
      color: #3b82f6;
    }
  `;

  constructor() {
    super();
    this.currentUser = null;
    this.currentView = 'marketplace';
    this.isLoading = true;
    this.selectedItemId = null;
    this.checkAuth();
  }

  async checkAuth() {
    const savedUser = localStorage.getItem('curioCoveUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
    this.isLoading = false;
  }

  handleLogin(user) {
    this.currentUser = user;
    localStorage.setItem('curioCoveUser', JSON.stringify(user));
    this.currentView = 'marketplace';
    this.selectedItemId = null;
  }

  handleLogout() {
    this.currentUser = null;
    localStorage.removeItem('curioCoveUser');
    this.currentView = 'marketplace';
    this.selectedItemId = null;
  }

  viewItem(itemId) {
    this.selectedItemId = itemId;
    this.currentView = 'item-detail';
  }

  goBack() {
    this.selectedItemId = null;
    this.currentView = 'marketplace';
  }

  render() {
    if (this.isLoading) {
      return html`<div class="flex items-center justify-center h-screen">Loading...</div>`;
    }

    return html`
      <!-- Navigation Bar -->
      <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center cursor-pointer" @click=${() => {
              this.currentView = 'marketplace';
              this.selectedItemId = null;
            }}>
              <span class="text-2xl mr-2">🏝️</span>
              <span class="font-bold text-xl text-gray-800">CurioCove</span>
              <span class="text-sm text-gray-500 ml-2">Marketplace</span>
            </div>

            <div class="flex items-center space-x-6">
              ${this.currentUser ? html`
                <a class="nav-link" @click=${() => {
                  this.currentView = 'marketplace';
                  this.selectedItemId = null;
                }}>Browse</a>
                <a class="nav-link" @click=${() => {
                  this.currentView = 'my-listings';
                  this.selectedItemId = null;
                }}>My Listings</a>
                <div class="flex items-center space-x-3">
                  <span class="text-sm text-gray-600"> ${this.currentUser.name}</span>
                  <button @click=${this.handleLogout} class="text-red-500 hover:text-red-700 text-sm">
                    Logout
                  </button>
                </div>
              ` : html`
                <button @click=${() => {
                  this.currentView = 'login';
                  this.selectedItemId = null;
                }} class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Login / Register
                </button>
              `}
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${this.renderCurrentView()}
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t mt-12 py-6">
        <div class="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 CurioCove Marketplace — Where collectors find their treasures
        </div>
      </footer>
    `;
  }

  renderCurrentView() {
    if (!this.currentUser && this.currentView !== 'login') {
      return html`
        <div class="text-center py-12">
          <h2 class="text-2xl font-bold mb-4">Welcome to CurioCove! 🏝️</h2>
          <p class="text-gray-600 mb-6">Please login to start buying and selling collectibles</p>
          <button @click=${() => this.currentView = 'login'} class="px-6 py-3 bg-blue-500 text-white rounded-lg">
            Login / Register
          </button>
        </div>
      `;
    }

    switch (this.currentView) {
      case 'login':
        return html`<login-form .onLogin=${(user) => this.handleLogin(user)}></login-form>`;
      case 'marketplace':
        return html`<item-grid .currentUser=${this.currentUser} @view-item=${(e) => this.viewItem(e.detail.itemId)}></item-grid>`;
      case 'item-detail':
        return html`<item-detail 
          .itemId=${this.selectedItemId}
          .currentUser=${this.currentUser}
          @back-to-marketplace=${this.goBack}
        ></item-detail>`;
      case 'my-listings':
        return html`<seller-dashboard 
          .currentUser=${this.currentUser}
          @back-to-marketplace=${this.goBack}
        ></seller-dashboard>`;
      default:
        return html`<item-grid .currentUser=${this.currentUser} @view-item=${(e) => this.viewItem(e.detail.itemId)}></item-grid>`;
    }
  }
}

customElements.define('app-shell', AppShell);
