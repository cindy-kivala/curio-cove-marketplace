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
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
          <div style="text-align:center; padding:3rem; color:#6b7280">
            No items found${this.searchTerm ? ` matching "${this.searchTerm}"` : ''}
          </div>
        ` : html`
          <div class="grid">
            ${this.filteredItems.map(item => html`
              <div class="card" @click=${() => this.viewItem(item.id)}>
                <img src="${item.image}" alt="${item.name}"
                  style="width:100%; height:200px; object-fit:cover;"
                  onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
                <div style="padding:15px;">
                  <h3 class="font-bold text-lg">${item.name}</h3>
                  <p class="text-green-600 font-bold mt-2">KES ${item.price.toLocaleString()}</p>
                  ${item.highestOffer ? html`
                    <p class="text-sm text-orange-500">Highest offer: KES ${item.highestOffer.toLocaleString()}</p>
                  ` : ''}
                  <p class="text-sm text-gray-500 mt-1">${item.sellerName}</p>
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
