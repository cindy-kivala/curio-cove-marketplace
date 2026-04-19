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
    success: { type: String },
    confirmDeleteId: { type: String },
    confirmOfferId: { type: String },
    previewImage: { type: String },
    activeTab: { type: String },
    purchases: { type: Array },
    purchasesLoading: { type: Boolean },
    ratingItemId: { type: String },
    pendingRating: { type: Object }
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

    @media (max-width: 640px) {
    .item-card {
      flex-direction: column;
      align-items: flex-start;
    }
    .item-actions {
      width: 100%;
      justify-content: flex-end;
    }
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
      image: '',
      condition: 'Good',
      category: 'Other'
    };
    this.error = '';
    this.success = '';
    this.confirmDeleteId = null;
    this.confirmOfferId = null;
    this.currentUser = null;
    this.previewImage = '';
    this.activeTab = 'listings';
    this.purchases = [];
    this.purchasesLoading = false;
    this.ratingItemId = null;
    this.pendingRating = 0;
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
      const response = await fetch(`${this.apiBase}/items/all?sellerId=${this.currentUser.id}`);
      if (response.ok) {
        this.myItems = await response.json();
      } else {
        const res2 = await fetch(`${this.apiBase}/items`);
        const allItems = await res2.json();
        this.myItems = allItems.filter(item => item.sellerId === this.currentUser?.id);
      }
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
          sellerName: this.currentUser.name,
          condition: this.newItem.condition || 'Good',
          category: this.newItem.category || 'Other'
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
    this.error = '';
    this.success = '';
    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        this.confirmDeleteId = null;
        this.success = 'Item deleted successfully';
        await this.loadMyItems();
      } else {
        this.confirmDeleteId = null;
        this.error = 'Failed to delete item. Please try again.';
      }
    } catch {
      this.confirmDeleteId = null;
      this.error = 'Network error. Please try again.';
    }
  }


  async confirmSale(itemId) {
    this.error = '';
    this.success = '';
    try {
      const response = await fetch(`${this.apiBase}/items/${itemId}/confirm-sale`, { method: 'POST' });
      if (response.ok) {
        this.success = 'Sale confirmed! Item removed from marketplace.';
        await this.loadMyItems();
      } else {
        this.error = 'Failed to confirm sale. Please try again.';
      }
    } catch {
      this.error = 'Network error. Please try again.';
    }
  }

  async acceptOffer(item) {
    this.error = '';
    this.success = '';
    try {
      const msgRes = await fetch(`${this.apiBase}/messages/item/${item.id}/poll/1970-01-01T00:00:00.000Z`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        // Find the matching offer message
        const offerMsg = data.messages
          .filter(m => m.type === 'offer' && m.price === item.highestOffer)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (offerMsg) {
          // Accept the matched offer
          await fetch(`${this.apiBase}/messages/${offerMsg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'accepted' })
          });
          // Reject all other pending offers for this item
          const otherOffers = data.messages.filter(
            m => m.type === 'offer' && m.status === 'pending' && m.id !== offerMsg.id
          );
          await Promise.all(otherOffers.map(m =>
            fetch(`${this.apiBase}/messages/${m.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'rejected' })
            })
          ));
        }
      }
      // Mark item as sold at the accepted offer price
      await fetch(`${this.apiBase}/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: item.highestOffer,
          status: 'sold',
          soldAt: new Date().toISOString(),
          soldTo: item.highestOfferBuyer
        })
      });
      this.confirmOfferId = null;
      this.success = `Offer of KES ${item.highestOffer.toLocaleString()} accepted! Item marked as sold.`;
      await this.loadMyItems();
    } catch {
      this.error = 'Failed to accept offer. Please try again.';
    }
  }

  async rejectOffer(item) {
    this.error = '';
    this.success = '';
    try {
      const msgRes = await fetch(`${this.apiBase}/messages/item/${item.id}/poll/1970-01-01T00:00:00.000Z`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        const pendingOffers = data.messages.filter(m => m.type === 'offer' && m.status === 'pending');
        await Promise.all(pendingOffers.map(m =>
          fetch(`${this.apiBase}/messages/${m.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
          })
        ));
      }
      // Clear highest offer from item
      await fetch(`${this.apiBase}/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highestOffer: null, highestOfferBuyer: null })
      });
      this.confirmOfferId = null;
      this.success = 'Offer rejected.';
      await this.loadMyItems();
    } catch {
      this.error = 'Failed to reject offer. Please try again.';
    }
  }

  async loadPurchases() {
    this.purchasesLoading = true;
    try {
      const res = await fetch(`${this.apiBase}/users/${this.currentUser.id}/purchases`);
      if (res.ok) this.purchases = await res.json();
    } catch {
      this.error = 'Failed to load purchases';
    } finally {
      this.purchasesLoading = false;
    }
  }

  async submitRating(item) {
    if (!this.pendingRating) return;
    try {
      const res = await fetch(`${this.apiBase}/users/${item.sellerId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: this.pendingRating,
          buyerId: this.currentUser.id,
          itemId: item.id
        })
      });
      if (res.ok) {
        this.success = `Rated ${this.pendingRating}⭐ — thank you!`;
        this.ratingItemId = null;
        this.pendingRating = 0;
        await this.loadPurchases();
      } else {
        const d = await res.json();
        this.error = d.error || 'Failed to submit rating';
      }
    } catch {
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

        <!-- Tab bar -->
        <div style="display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid #e5e7eb;">
          <button @click=${() => this.activeTab = 'listings'}
            style="padding:10px 24px;border:none;cursor:pointer;font-weight:600;background:none;
              border-bottom:${this.activeTab === 'listings' ? '2px solid #3b82f6' : 'none'};
              color:${this.activeTab === 'listings' ? '#3b82f6' : '#6b7280'}">
            My Listings
          </button>
          <button @click=${() => { this.activeTab = 'purchases'; this.loadPurchases(); }}
            style="padding:10px 24px;border:none;cursor:pointer;font-weight:600;background:none;
              border-bottom:${this.activeTab === 'purchases' ? '2px solid #3b82f6' : 'none'};
              color:${this.activeTab === 'purchases' ? '#3b82f6' : '#6b7280'}">
            My Purchases
          </button>
        </div>

        ${this.error   ? html`<div class="error">${this.error}</div>`     : ''}
        ${this.success ? html`<div class="success">${this.success}</div>` : ''}

        ${this.activeTab === 'purchases' ? html`
          ${this.purchasesLoading ? html`
            <div style="text-align:center;padding:3rem">Loading purchases...</div>
          ` : this.purchases.length === 0 ? html`
            <div class="empty-state">
              <div style="font-size:3rem">🛍️</div>
              <h3 style="font-size:1.25rem;font-weight:700;margin:12px 0 6px">No purchases yet</h3>
              <p style="color:#9ca3af">Items you buy will appear here.</p>
            </div>
          ` : html`
            ${this.purchases.map(item => html`
              <div class="item-card">
                <img src="${item.image}" alt="${item.name}" class="item-image"
                  onerror="this.src='https://via.placeholder.com/80x80?text=?'" />
                <div class="item-info">
                  <h3 class="font-bold text-lg">${item.name}</h3>
                  <p class="text-green-600 font-bold">KES ${item.price.toLocaleString()}</p>
                  <p class="text-sm text-gray-500">Sold by: ${item.sellerName}</p>
                  <p class="text-sm text-gray-400">${item.soldAt ? new Date(item.soldAt).toLocaleDateString() : ''}</p>
                  <span class="badge" style="background:#d1fae5;color:#065f46;margin-top:4px;display:inline-block">
                    Purchased
                  </span>
                  ${this.ratingItemId === item.id ? html`
                    <div style="margin-top:8px;display:flex;align-items:center;gap:6px">
                      ${[1,2,3,4,5].map(star => html`
                        <span @click=${() => this.pendingRating = star}
                          style="font-size:1.5rem;cursor:pointer;opacity:${this.pendingRating >= star ? '1' : '0.3'}">
                          ⭐
                        </span>
                      `)}
                      <button @click=${() => this.submitRating(item)}
                        style="background:#3b82f6;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                        Submit
                      </button>
                      <button @click=${() => this.ratingItemId = null}
                        style="background:#e5e7eb;color:#374151;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                        Cancel
                      </button>
                    </div>
                  ` : html`
                    <button @click=${() => this.ratingItemId = item.id}
                      style="margin-top:6px;background:none;border:1px solid #d1d5db;padding:4px 10px;
                        border-radius:4px;cursor:pointer;font-size:0.8rem;color:#374151">
                      Rate Seller
                    </button>
                  `}
                 </div>
              </div>
            `)}
          `}
        ` : html`

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
              <input type="text" .value=${this.newItem.image} @input=${(e) => {
                this.handleInput(e, 'image');
                this.previewImage = e.target.value;
              }} placeholder="https://..." />
              ${this.previewImage ? html`
                <img src="${this.previewImage}" style="height:100px;margin-top:8px;border-radius:6px;object-fit:cover;"
                  @error=${(e) => { e.target.style.display = 'none'; }}
                  @load=${(e)  => { e.target.style.display = 'block'; }} />
              ` : ''}
            </div>
            <div class="form-group">
              <label>Condition *</label>
              <select style="width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;"
                .value=${this.newItem.condition}
                @change=${(e) => this.newItem = { ...this.newItem, condition: e.target.value }}>
                <option value="Mint">Mint</option>
                <option value="Good" selected>Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select style="width:100%;padding:10px;border:1px solid #ddd;border-radius:5px;"
                .value=${this.newItem.category}
                @change=${(e) => this.newItem = { ...this.newItem, category: e.target.value }}>
                <option value="Comics & Cards">Comics & Cards</option>
                <option value="Antique Furniture">Antique Furniture</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Art & Memorabilia">Art & Memorabilia</option>
                <option value="Toys">Toys</option>
                <option value="Literature">Literature</option>
                <option value="Luxury Experience">Luxury Experience</option>
                <option value="Other" selected>Other</option>
              </select>
            </div>

            <button @click=${this.createItem} class="btn-primary" ?disabled=${this.isLoading}>
              ${this.isLoading ? 'Creating...' : 'List Item'}
            </button>
          </div>
        ` : ''}

        ${this.isLoading ? html`<div style="text-align:center;padding:3rem">Loading your listings...</div>` : ''}

        ${!this.isLoading && this.myItems.length === 0 ? html`
          <div class="empty-state">
            <div style="font-size:3rem">📦</div>
            <h3 style="font-size:1.25rem;font-weight:700;margin:12px 0 6px">No listings yet</h3>
            <p style="margin-bottom:1rem;color:#9ca3af">Your shelf is empty — list your first collectible!</p>
            <button @click=${() => this.showCreateForm = true} class="btn-primary">Create Your First Listing</button>
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
              <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
                ${item.condition ? html`
                  <span class="badge" style="background:#ede9fe;color:#5b21b6">${item.condition}</span>
                ` : ''}
                ${item.category ? html`
                  <span class="badge" style="background:#e0f2fe;color:#0369a1">${item.category}</span>
                ` : ''}
              </div>
              <div style="margin-top:8px">
                ${item.status === 'sold'
                  ? html`<span class="badge" style="background:#f3f4f6;color:#6b7280">Sold</span>`
                  : item.paymentStatus === 'paid'
                  ? html`<span class="badge badge-paid">Payment Received</span>`
                  : html`<span class="badge badge-active">Active</span>`}
                ${item.highestOffer && item.paymentStatus !== 'paid' ? html`
                  <span class="badge" style="background:#fef3c7;color:#92400e;margin-left:4px">
                    Offer: KES ${item.highestOffer.toLocaleString()}
                  </span>
                  ${this.confirmOfferId === item.id ? html`
                    <div style="margin-top:8px;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px">
                      <span style="font-size:0.875rem;color:#14532d">Accept KES ${item.highestOffer.toLocaleString()}?</span>
                      <button @click=${() => this.acceptOffer(item)}
                        style="background:#16a34a;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                        Accept
                      </button>
                      <button @click=${() => this.rejectOffer(item)}
                        style="background:#dc2626;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                        Reject
                      </button>
                      <button @click=${() => this.confirmOfferId = null}
                        style="background:#e5e7eb;color:#374151;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                        Cancel
                      </button>
                    </div>
                  ` : html`
                    <button @click=${() => this.confirmOfferId = item.id}
                      style="margin-top:6px;background:#f59e0b;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.8rem">
                      Review Offer
                    </button>
                  `}
                ` : ''}
              </div>
            </div>
            <div class="item-actions">
              ${item.paymentStatus === 'paid' ? html`
                <button @click=${() => this.confirmSale(item.id)} class="btn-success">Confirm Sale</button>
              ` : ''}
              ${this.confirmDeleteId === item.id ? html`
                <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px">
                  <span style="font-size:0.875rem;color:#7f1d1d">Delete this listing?</span>
                  <button @click=${() => this.deleteItem(item.id)}
                    style="background:#dc2626;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                    Yes
                  </button>
                  <button @click=${() => this.confirmDeleteId = null}
                    style="background:#e5e7eb;color:#374151;border:none;padding:4px 10px;border-radius:4px;cursor:pointer">
                    Cancel
                  </button>
                </div>
              ` : html`
                <button @click=${() => this.confirmDeleteId = item.id} class="btn-danger">Delete</button>
              `}
            </div>
          </div>
        `)}
        `}
      </div>
    `;
  }
}

customElements.define('seller-dashboard', SellerDashboard);
