import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/index.js';

class ItemGrid extends LitElement {
  static properties = {
    items: { type: Array },
    isLoading: { type: Boolean },
    searchTerm: { type: String }
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
    }
    
    .card:hover {
      transform: scale(1.02);
  `; 

  constructor() {
    super();
    this.items = [];
    this.isLoading = true;
    this.searchTerm = '';
    this.loadItems();
  }

  async loadItems() {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      this.items = data;
    } catch (error) {
      console.error(error);
      
    }
  }

  
  searchItems() {
    return this.items;
  }

  render() {
    return html`
      <div>
        
        <input type="text" placeholder="Search items..." class="search-input">
        
        ${this.isLoading ? html`<div>Loading...</div>` : html`
          <div class="grid">
            ${this.items.map(item => html`
              <div class="card" @click=${() => console.log(item.id)}>
                <img src="${item.image}" alt="${item.name}" style="width:100%; height:200px; object-fit:cover;">
                <div style="padding:15px;">
                  <h3>${item.name}</h3>
                  <p>$${item.price}</p>
              
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
