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
    success: { type: String }
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
    this.currentUser = null;
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


  // async connectedCallback() {
  //   super.connectedCallback();
    
  //   // Read attributes from EJS
  //   const apiBaseAttr = this.getAttribute('api-base');
  //   if (apiBaseAttr) this.apiBase = apiBaseAttr;
    
  //   const itemIdAttr = this.getAttribute('item-id');
  //   if (itemIdAttr) this.itemId = itemIdAttr;
    
  //   const userAttr = this.getAttribute('current-user');
  //   if (userAttr && userAttr !== '') {
  //       try {
  //           this.currentUser = JSON.parse(userAttr);
  //       } catch(e) {
  //           console.error('Failed to parse user:', e);
  //       }
  //   }
    
    // Load the item data
  //   await this.loadItem();
  // }

  async loadItem() {
    this.isLoading = true;
    try {
        const response = await fetch(`${this.apiBase}/items/${this.itemId}`);
        if (response.ok) {
            this.item = await response.json();
        } else {
          this.error = 'Item not found';
        }
    } catch (error) {
        this.error = 'Failed to load item';
    } finally {
        this.isLoading = false;
    }
  }
  // async connectedCallback() {
  //   super.connectedCallback();
  //   await this.loadItem();
  // }

  // async loadItem() {
  //   this.isLoading = true;
  //   try {
  //     const response = await fetch(`/api/items/${this.itemId}`);
  //     if (response.ok) {
  //       this.item = await response.json();
  //     } else {
  //       this.error = 'Item not found';
  //     }
  //   } catch (error) {
  //     this.error = 'Failed to load item';
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }

  async makeOffer() {
    if (!this.currentUser) {
      this.error = 'Please login to make an offer';
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
      await fetch(`${this.apiBase}/messages`, {
        method:  'POST',
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

      // Update highest offer on item
      await fetch(`${this.apiBase}/items/${this.itemId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highestOffer:      this.offerAmount,
          highestOfferBuyer: this.currentUser.id
        })
      });

      this.success = `Offer of $${this.offerAmount.toLocaleString()} submitted!
       Seller will review and respond in chat.`;

      this.offerAmount = 0;
      await this.loadItem(); // Reload to show updated highest offer
    } catch {
      this.error = 'Network error. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async checkout() {
    if (!confirm('Confirm payment? The seller will be notified.')) return;
    
    try {
      const response = await fetch(`${this.apiBase}/items/${this.itemId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: this.currentUser.id })
      });
      
      if (response.ok) {
        alert('Payment confirmed! Waiting for seller to complete the sale.');
        window.location.href = '/' //MPA Fix: navigate instead of dispatching event to parent
      } else {
        alert('Checkout failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }

  async confirmSale() {
    if (!confirm('Have you received payment? This will remove the item from marketplace.')) return;
    try {
      const response = await fetch(`${this.apiBase}/items/${this.itemId}/confirm-sale`, { method: 'POST' });
      if (response.ok) {
        alert('Sale confirmed! Item removed from marketplace.');
        window.location.href = '/'; // MPA FIX
      } else { alert('Failed to confirm sale.'); }
    } catch { alert('Network error. Please try again.'); }
  }
  goBack() {
    window.location.href = '/';
  }

  render() {
    if (this.isLoading) {
      return html`<div style="text-align: center; padding: 13rem;">Loading item details...</div>`;
    }
    
    // if (this.error && !this.item) {
    //   return html`
    //     <div class="text-center py-12">
    //       <p class="text-red-500">${this.error}</p>
    //       <button @click=${this.goBack} class="btn-primary mt-4">Go Back</button>
    //     </div>
    //   `;
    // }

    if (!this.item) return html`
      <div style="text-align:center;padding:3rem">
        <p style="color:red">${this.error || 'Item not found'}</p>
        <button @click=${this.goBack} class="btn-primary" style="margin-top:1rem">Go Back</button>
      </div>
    `;
    
    const isSeller = this.currentUser && this.currentUser.id === this.item.sellerId;
    
    return html`
      <div class="container">
        <button @click=${this.goBack} class="mb-4 text-blue-500 hover:underline">← Back to Marketplace</button>
        
        <div class="detail-card">
          <img src="${this.item.image}" alt="${this.item.name}" style="width:100%; max-height:400px; object-fit:cover;">
          
          <div style="padding: 24px;">
            <h1 class="text-3xl font-bold mb-2">${this.item.name}</h1>
            <p class="text-gray-600 mb-4">Sold by: ${this.item.sellerName}</p>
            <p class="text-gray-700 mb-6">${this.item.description}</p>
            
            <div class="flex items-center justify-between">
              <div>
                <span class="text-2xl font-bold text-green-600">$${this.item.price}</span>
                ${this.item.highestOffer ? html`
                  <p class="text-sm text-orange-500">Highest offer: $${this.item.highestOffer}</p>
                ` : ''}
              </div>
              
              ${!isSeller && this.currentUser ? html`
                <button @click=${this.checkout} class="btn-success">Buy Now at $${this.item.price}</button>
              ` : ''}
            </div>
            
            <!-- Offer Section (for buyers, not sellers) -->
            ${!isSeller && this.currentUser ? html`
              <div class="offer-section">
                <h3 class="font-bold mb-2">Make an Offer</h3>
                <div class="flex gap-2">
                  <input 
                    type="number" 
                    class="offer-input"
                    placeholder="Your offer"
                    .value=${this.offerAmount || ''}
                    }
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

            ${!this.currentUser ? html`
              <div style="margin-top:1rem; padding:1rem; background:#f3f4f6; border-radius:8px; text-align:center">
                <p style="color:#6b7280; margin-bottom:0.5rem">Sign in to make offers and chat</p>
                <button @click=${() => window.location.href='/login'} class="btn-primary">Login / Register</button>
              </div>
            ` : ''}
            
            <!-- Chat Section -->
            <button @click=${() => this.showChat = !this.showChat} class="chat-toggle">
              ${this.showChat ? 'Hide Chat' : 'Message Seller'}
            </button>
            
            ${this.showChat ? html`
              <chat-panel 
                api-base="${this.apiBase}"
                itemId="${this.itemId}"
                currentUser="${this.currentUser ? JSON.stringify(this.currentUser) : ''}"
                sellerName="${this.item.sellerName}"
              ></chat-panel>
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
  
  async confirmSale() {
    if (!confirm('Have you received the payment? This will remove the item from marketplace.')) return;
    
    try {
      const response = await fetch(`${this.apiBase}/items/${this.itemId}/confirm-sale`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Sale confirmed! Item removed from marketplace.');
        this.dispatchEvent(new CustomEvent('back-to-marketplace'));
      } else {
        alert('Failed to confirm sale. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  }
}

customElements.define('item-detail', ItemDetail);
