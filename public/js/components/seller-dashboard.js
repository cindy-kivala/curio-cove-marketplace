import { LitElement, html, css } from 'lit';

class SellerDashboard extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    currentUser: { type: Object },
    myItems: { type: Array },
    isLoading: { type: Boolean },
    showCreateForm: { type: Boolean },
    newItem: { type: Object },
    error: { type: String },
    success: { type: String }
  };

  static styles = css`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-danger {
      background: #ef4444;
      color: white;
      padding: 6px 12px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .btn-success {
      background: #10b981;
      color: white;
      padding: 6px 12px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .item-card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      gap: 16px;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .item-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }
    .item-info {
      flex: 1;
    }
    .item-actions {
      display: flex;
      gap: 8px;
    }
    .form-container {
      background: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .error {
      color: red;
      margin-top: 8px;
    }
    .success {
      color: green;
      margin-top: 8px;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .badge-paid {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-active {
      background: #dbeafe;
      color: #1e40af;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
      color: #6b7280;
    }
  `;

  constructor() {
    super();
    this.myItems = [];
    this.isLoading = true;
    this.showCreateForm = false;
    this.newItem = {
      name: '',
      description: '',
      price: '',
      image: ''
    };
    this.error = '';
    this.success = '';
    this.currentUser = null;
  }

  connectedCallback() {
    super.connectedCallback();
    
    const base = this.getAttribute('api-base');
    if (base) this.apiBase = base;

    // Read user from EJS attribute OR localStorage
    const userAttr = this.getAttribute('current-user');
    if (userAttr && userAttr !== '') {
      try { this.currentUser = JSON.parse(userAttr); } catch {}
    }
    if (!this.currentUser) {
      const stored = localStorage.getItem('curioCoveUser');
      if (stored) this.currentUser = JSON.parse(stored);
    }

    // Redirect to login if not authenticated
    if (!this.currentUser) {
      window.location.href = '/login';
      return;
    }

    this.loadMyItems();
  }

  async loadMyItems() {
    this.isLoading = true;
    try {
      const response = await fetch(`${this.apiBase}/items`);
      const allItems = await response.json();

      // Filter items owned by current user
      this.myItems = allItems.filter(item => item.sellerId === 
  this.currentUser?.id);
    } catch (error) {
      this.error = 'Failed to load your listings';
    } finally {
      this.isLoading = false;
    }
  }

  async createItem() {
    if (!this.newItem.name || !this.newItem.price) {
      this.error = 'Name and price are required';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = '';

    try {
      const response = await fetch(`${this.apiBase}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.newItem.name,
          description: this.newItem.description || 'No description provided',
          price: parseFloat(this.newItem.price),
          image: this.newItem.image || 'https://via.placeholder.com/400x300?text=CurioCove',
          sellerId: this.currentUser.id,
          sellerName: this.currentUser.name
        })
      });

      if (response.ok) {
        this.success = 'Item listed successfully!';
        this.showCreateForm = false;
        this.newItem = { name: '', description: '', price: '', image: '' };
        await this.loadMyItems();
      } else {
        const error = await response.json();
        this.error = error.error || 'Failed to create listing';
      }
    } catch (error) {
      this.error = 'Network error. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.success = 'Item deleted successfully';
        await this.loadMyItems();
      } else this.error = 'Failed to delete item';
    } catch (error) {
      this.error = 'Network error. Please try again.';
    }
  }

  async confirmSale(itemId) {
    if (!confirm('Confirm sale? This will remove the item from marketplace.')) return;

    try {
      const response = await fetch(`/api/items/${itemId}/confirm-sale`, {
        method: 'POST'
      });

      if (response.ok) {
        this.success = 'Sale confirmed! Item removed from marketplace.';
        await this.loadMyItems();
      } else {
        this.error = 'Failed to confirm sale';
      }
    } catch (error) {
      this.error = 'Network error. Please try again.';
    }
  }

  handleInput(e, field) {
    this.newItem = { ...this.newItem, [field]: e.target.value };
  }

  render() {
    return html`
      <div class="dashboard">
        <div class="header">
          <div>
            <button @click=${() => window.location.href='/'} style="color:#3b82f6;background:none;border:none;cursor:pointer;margin-bottom:8px">
              ← Back to Marketplace
            </button>
            <h1 class="text-2xl font-bold">My Listings</h1>
            <p class="text-gray-600">Welcome, ${this.currentUser?.name}</p>
          </div>
          <button @click=${() => this.showCreateForm = !this.showCreateForm} class="btn-primary">
            ${this.showCreateForm ? 'Cancel' : '+ New Listing'}
          </button>
        </div>

        ${this.error   ? html`<div class="error">${this.error}</div>`     : ''}
        ${this.success ? html`<div class="success">${this.success}</div>` : ''}

        ${this.showCreateForm ? html`
          <div class="form-container">
            <h2 class="text-xl font-bold mb-4">Create New Listing</h2>
            <div class="form-group">
              <label>Item Name *</label>
              <input type="text" .value=${this.newItem.name} @input=${(e) => this.handleInput(e,'name')} placeholder="e.g., Vintage Comic Book" />
            </div>
            <div class="form-group">
              <label>Price (KES) *</label>
              <input type="number" .value=${this.newItem.price} @input=${(e) => this.handleInput(e,'price')} placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea rows="3" .value=${this.newItem.description} @input=${(e) => this.handleInput(e,'description')} placeholder="Describe your item..."></textarea>
            </div>
            <div class="form-group">
              <label>Image URL (optional)</label>
              <input type="text" .value=${this.newItem.image} @input=${(e) => this.handleInput(e,'image')} placeholder="https://..." />
            </div>
            <button @click=${this.createItem} class="btn-primary" ?disabled=${this.isLoading}>
              ${this.isLoading ? 'Creating...' : 'List Item'}
            </button>
          </div>
        ` : ''}

        ${this.isLoading ? html`<div style="text-align:center;padding:3rem">Loading your listings...</div>` : ''}

        ${!this.isLoading && this.myItems.length === 0 ? html`
          <div class="empty-state">
            <p>You haven't listed any items yet.</p>
            <button @click=${() => this.showCreateForm = true} class="btn-primary" style="margin-top:1rem">
              Create Your First Listing
            </button>
          </div>
        ` : ''}

        ${this.myItems.map(item => html`
          <div class="item-card">
            <img src="${item.image}" alt="${item.name}" class="item-image"
              onerror="this.src='https://via.placeholder.com/80x80?text=?'" />
            <div class="item-info">
              <h3 class="font-bold text-lg">${item.name}</h3>
              <p class="text-green-600 font-bold">KES ${item.price.toLocaleString()}</p>
              <p class="text-sm text-gray-500">${item.description?.substring(0,100)}...</p>
              <div style="margin-top:8px">
                ${item.paymentStatus === 'paid'
                  ? html`<span class="badge badge-paid">Payment Received</span>`
                  : html`<span class="badge badge-active">Active</span>`}
                ${item.highestOffer ? html`
                  <span class="badge" style="background:#fef3c7;color:#92400e;margin-left:4px">
                    Offer: KES ${item.highestOffer.toLocaleString()}
                  </span>
                ` : ''}
              </div>
            </div>
            <div class="item-actions">
              ${item.paymentStatus === 'paid' ? html`
                <button @click=${() => this.confirmSale(item.id)} class="btn-success">Confirm Sale</button>
              ` : ''}
              <button @click=${() => this.deleteItem(item.id)} class="btn-danger">Delete</button>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}

customElements.define('seller-dashboard', SellerDashboard);
