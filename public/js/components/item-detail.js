import { LitElement, html, css } from 'lit';

class ItemDetail extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    itemId: { type: String, attribute: 'item-id' },
    currentUser: { type: Object, attribute: 'current-user' },
    item: { type: Object },
    isLoading: { type: Boolean },
    offerAmount: { type: Number },
    showChat: { type: Boolean },
    error: { type: String },
    success: { type: String },
    showBuyConfirm : { type: Boolean },
    offerHistory: { type: Array }
  };

  static styles = css`
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .detail-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .offer-section {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .offer-input {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      width: 150px;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .btn-success {
      background: #10b981;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .error {
      color: red;
      margin-top: 10px;
    }
    .success {
      color: green;
      margin-top: 10px;
    }
    .chat-toggle {
      margin-top: 20px;
      background: #8b5cf6;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.item = null;
    this.isLoading = true;
    this.offerAmount = 0;
    this.showChat = false;
    this.error = '';
    this.success = '';
    this.showBuyConfirm = false;
    this.currentUser = null;
    this.offerHistory = [];
  }

  connectedCallback() {
    super.connectedCallback();

    // Read attributes set by EJS
    const base = this.getAttribute('api-base');
    if (base) this.apiBase = base;

    const itemId = this.getAttribute('item-id');
    if (itemId) this.itemId = itemId;

    // Read user from EJS attribute OR fall back to localStorage
    const userAttr = this.getAttribute('current-user');
    if (userAttr && userAttr !== '') {
        try { this.currentUser = JSON.parse(userAttr); } catch {}
      } else {
        const stored = localStorage.getItem('curioCoveUser');
        if (stored) this.currentUser = JSON.parse(stored);
      }
    this.loadItem();
  }


  async loadItem() {
    this.isLoading = true;
    try {
        const response = await fetch(`${this.apiBase}/items/${this.itemId}`);
        if (response.ok) {
            this.item = await response.json();
            const msgRes = await fetch(`${this.apiBase}/messages/item/${this.itemId}/poll/1970-01-01T00:00:00.000Z`);
            if (msgRes.ok) {
              const data = await msgRes.json();
              this.offerHistory = (data.messages || []).filter(m => m.type === 'offer');
            }
        } else {
          this.error = 'Item not found';
        }
    } catch (error) {
        this.error = 'Failed to load item';
    } finally {
        this.isLoading = false;
    }
  }

  async makeOffer() {
    if (!this.currentUser) {
      this.error = 'Please login to make an offer';
      return;
    }

    if (this.item.status === 'sold') {
      this.error = 'This item has already been sold';
      return;
    }
    
    if (this.offerAmount <= 0) {
      this.error = 'Please enter a valid offer amount';
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    this.success = '';
    
    try {
      const msgResponse = await fetch(`${this.apiBase}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId:        this.itemId,
          senderId:      this.currentUser.id,
          senderName:    this.currentUser.name,
          content:       String(this.offerAmount),
          type:          'offer',
          price:         this.offerAmount,
          originalPrice: this.item.price,
          status:        'pending'
        })
      });

      const putResponse = await fetch(`${this.apiBase}/items/${this.itemId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highestOffer:      this.offerAmount,
          highestOfferBuyer: this.currentUser.id
        })
      });

      if (putResponse.status === 409) {
        this.error = 'This item has already been sold';
        await this.loadItem();
        return;
      }

      this.success = `Offer of KES ${this.offerAmount.toLocaleString()} submitted! Seller will review and respond in chat.`;
      this.offerAmount = 0;
      await this.loadItem();
    } catch {
      this.error = 'Network error. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async checkout() {
    this.error = '';
    if (this.item.status === 'sold') {
      this.error = 'This item has already been sold';
      return;
    }
    try {
      const response = await fetch(`${this.apiBase}/items/${this.itemId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: this.currentUser.id })
      });
      
      if (response.ok) {
        this.showBuyConfirm = false;
        this.success = 'Payment confirmed! Waiting for seller to complete the sale.';
        await this.loadItem();
      } else {
        const data = await response.json();
        this.error = data.error || 'Checkout failed. Please try again.';
        await this.loadItem(); // reload to show sold banner
      }
    } catch {
      this.error = 'Network error. Please try again.';
    }
  }

  async confirmSale() {
    this.error = '';
    try {
      const response = await fetch(`${this.apiBase}/items/${this.itemId}/confirm-sale`, { method: 'POST' });
      if (response.ok) {
        // Short delay so user sees the success message before redirect
        this.success = 'Sale confirmed! Redirecting...';
        setTimeout(() => window.location.href = '/', 1500);
      } else {
        this.error = 'Failed to confirm sale. Please try again.';
      }
    } catch {
      this.error = 'Network error. Please try again.';
    }
  }

  _timeAgo(timestamp) {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  }

  goBack() {
    window.location.href = '/';
  }

  render() {
    if (this.isLoading) {
      return html`<div style="text-align: center; padding: 13rem;">Loading item details...</div>`;
    }
    
    if (!this.item) return html`
      <div style="text-align:center;padding:3rem">
        <p style="color:red">${this.error || 'Item not found'}</p>
        <button @click=${this.goBack} class="btn-primary" style="margin-top:1rem">Go Back</button>
      </div>
    `;
    
    const isSeller = this.currentUser && 
      (this.currentUser.id === this.item.sellerId || 
       this.currentUser.name === this.item.sellerName);
    
    return html`
      <div class="container">
        <button @click=${this.goBack} class="mb-4 text-blue-500 hover:underline">← Back to Marketplace</button>
        
        <div class="detail-card">
          <img src="${this.item.image}" alt="${this.item.name}" style="width:100%; max-height:400px; object-fit:cover;">
          
          <div style="padding: 24px;">
            <h1 class="text-3xl font-bold mb-2">${this.item.name}</h1>
            <p class="text-gray-600 mb-4">Sold by: ${this.item.sellerName}</p>
            <p class="text-gray-700 mb-6">${this.item.description}</p>
            ${this.item.status === 'sold' ? html`
              <div style="display:inline-block;background:#f3f4f6;color:#6b7280;
                padding:6px 14px;border-radius:9999px;font-weight:600;margin-bottom:12px">
                🔴 This item has been sold
              </div>
            ` : ''}
            
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
              <div>
                <span class="text-2xl font-bold text-green-600">$${this.item.price}</span>
                ${this.item.highestOffer ? html`
                  <p class="text-sm text-orange-500">Highest offer: $${this.item.highestOffer}</p>
                ` : ''}
              </div>
              
               ${!isSeller && this.currentUser && this.item.status !== 'sold' ? html`
                ${this.showBuyConfirm ? html`
                  <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px">
                    <span>Confirm purchase for KES ${this.item.price.toLocaleString()}?</span>
                    <button @click=${this.checkout}
                      style="background:#16a34a;color:white;border:none;padding:6px 14px;border-radius:4px;cursor:pointer">
                      Yes, Buy Now
                    </button>
                    <button @click=${() => this.showBuyConfirm = false}
                      style="background:#e5e7eb;color:#374151;border:none;padding:6px 14px;border-radius:4px;cursor:pointer">
                      Cancel
                    </button>
                  </div>
                ` : html`
                  <button @click=${() => this.showBuyConfirm = true} class="btn-success">
                    Buy Now at KES ${this.item.price.toLocaleString()}
                  </button>
                `}
              ` : ''}
            </div>
            
            <!-- Offer Section (for buyers, not sellers) -->
            ${!isSeller && this.currentUser && this.item.status !== 'sold' ? html`
               <div class="offer-section">
                <h3 class="font-bold mb-2">Make an Offer</h3>
                <div class="flex gap-2">
                  <input 
                    type="number" 
                    class="offer-input"
                    placeholder="Your offer"
                    .value=${this.offerAmount || ''}
                       @input=${(e) => this.offerAmount = parseFloat(e.target.value)}
                  >
                  <button @click=${this.makeOffer} class="btn-primary" ?disabled=${this.isLoading}>
                    Submit Offer
                  </button>
                </div>
                ${this.error ? html`<div class="error">${this.error}</div>` : ''}
                ${this.success ? html`<div class="success">${this.success}</div>` : ''}
              </div>
            ` : ''}

            ${this.offerHistory.length > 0 ? html`
              <div style="margin-top:20px">
                <h3 style="font-weight:700;margin-bottom:10px">Previous Offers</h3>
                ${this.offerHistory.map(o => html`
                  <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:8px 12px;border-radius:6px;background:#f9fafb;margin-bottom:6px;font-size:0.875rem">
                    <span>${o.senderName} offered <strong>KES ${Number(o.price).toLocaleString()}</strong></span>
                    <span style="color:#6b7280">${this._timeAgo(o.timestamp)}</span>
                    <span style="font-weight:600;color:${
                      o.status === 'accepted' ? '#16a34a' :
                      o.status === 'rejected' ? '#dc2626' : '#d97706'
                    }">${o.status === 'accepted' ? 'Accepted' : o.status === 'rejected' ? 'Rejected' : 'Pending'}</span>
                  </div>
                `)}
              </div>
            ` : ''}

            ${!this.currentUser ? html`
              <div style="margin-top:1rem; padding:1rem; background:#f3f4f6; border-radius:8px; text-align:center">
                <p style="color:#6b7280; margin-bottom:0.5rem">Sign in to make offers and chat</p>
                <button @click=${() => window.location.href='/login'} class="btn-primary">Login / Register</button>
              </div>
            ` : ''}
            
            <!-- Chat Section -->
            ${this.currentUser ? html`
              <button @click=${() => this.showChat = !this.showChat} class="chat-toggle">
                ${this.showChat ? 'Hide Chat' : isSeller ? 'View Messages' : 'Message Seller'}
              </button>

            ${this.showChat ? html`
              <chat-panel
                api-base="${this.apiBase}"
                item-id="${this.itemId}"
                current-user="${this.currentUser ? JSON.stringify(this.currentUser) : ''}"
                seller-name="${this.item.sellerName}"
                seller-id="${this.item.sellerId}"
              ></chat-panel>
                
              ` : ''}
          ` : ''}
            
            <!-- Seller Actions -->
            ${isSeller && this.item.paymentStatus === 'paid' ? html`
              <div class="offer-section mt-4">
                <p class="text-green-600 mb-2">Payment confirmed by buyer!</p>
                <button @click=${this.confirmSale} class="btn-success">
                  Confirm Sale & Remove Item
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('item-detail', ItemDetail);
