import { LitElement, html, css } from 'lit';

class ItemGrid extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    items: { type: Array },
    isLoading: { type: Boolean },
    searchTerm: { type: String },
    filteredItems: { type: Array }
  };

  static styles = css`
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
      gap: 20px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .card:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .search-input {
      width: 100%;
      padding: 12px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }
  `; 

  constructor() {
    super();
    this.items = [];
    this.isLoading = true;
    this.searchTerm = '';
    this.filteredItems = [];
  }

  // firstUpdated fires after first render, when all attributes are guaranteed set
  firstUpdated() {
    this.loadItems();
  }


  async loadItems() {
    this.isLoading = true;
    try {
      const base = this.apiBase || '/api';
      const url = this.searchTerm
        ? `${base}/items?search=${encodeURIComponent(this.searchTerm)}`
        : `${base}/items`;
      const response = await fetch(url);
      const data = await response.json();
      this.items         = data;
      this.filteredItems = data;
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      this.isLoading = false;
    }
  }

  
  // searchItems() {
  //   return this.items;
  // }

  handleSearch(e) {
    const term = e.target.value.toLowerCase();
    this.searchTerm    = term;
    this.filteredItems = this.items.filter(item => 
      item.name.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }

  highlightMatch(text, term) {
    if (!term) return html`${text}`;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return html`${text}`;
    return html`${text.slice(0, idx)}<strong>${text.slice(idx, idx + term.length)}</strong>${text.slice(idx + term.length)}`;
  }

  // MPA Fix: navigate to the item page instead of dispatching a custom event
  viewItem(itemId) {
    window.location.href = `/item/${itemId}`; //TEST THIS!!!!
  }

  render() {
    if (this.isLoading) {
      return html`<div style="text-align:center; padding:3rem">Loading treasures...</div>`;
    }

    return html`
      <div>
        <input
          type="text"
          class="search-input"
          placeholder="Search collectibles..."
          @input=${this.handleSearch}
        />

        ${this.filteredItems.length === 0 ? html`
          <div style="text-align:center;padding:4rem;color:#6b7280">
            <div style="font-size:3rem">🔍</div>
            <h3 style="font-size:1.25rem;font-weight:700;margin:12px 0 6px">No items found</h3>
            <p style="color:#9ca3af">${this.searchTerm ? `No results for "${this.searchTerm}" — try a different search` : 'Check back soon for new listings!'}</p>
          </div>
                  ` : html`
          <div class="grid">
            ${this.filteredItems.map(item => html`
              <div class="card" @click=${() => this.viewItem(item.id)}>
                <img src="${item.image}" alt="${item.name}"
                  style="width:100%; height:200px; object-fit:cover;"
                  onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
                <div style="padding:15px;">
                  <h3 class="font-bold text-lg">${this.highlightMatch(item.name, this.searchTerm)}</h3>
                  <p class="text-green-600 font-bold mt-2">KES ${item.price.toLocaleString()}</p>
                  ${item.highestOffer ? html`
                    <p class="text-sm text-orange-500">Highest offer: KES ${item.highestOffer.toLocaleString()}</p>
                  ` : ''}
                  <p class="text-sm text-gray-500 mt-1">${item.sellerName}</p>
                  ${item.paymentStatus === 'paid' ? html`
                    <span style="font-size:0.75rem;background:#d1fae5;color:#065f46;padding:2px 7px;border-radius:9999px">
                      🟢 Payment Confirmed
                    </span>
                  ` : item.highestOffer ? html`
                    <span style="font-size:0.75rem;background:#fef9c3;color:#854d0e;padding:2px 7px;border-radius:9999px">
                      🟡 Offer Pending
                    </span>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;

  }
}

customElements.define('item-grid', ItemGrid);
