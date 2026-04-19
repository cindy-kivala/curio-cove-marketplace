import { LitElement, html, css } from 'lit';

class ItemGrid extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    items: { type: Array },
    isLoading: { type: Boolean },
    searchTerm: { type: String },
    filteredItems: { type: Array },
    selectedCategory: { type: String }
  };

  static styles = css`
    :host { display: block; }
    .search-wrap {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }
    .search-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e8e4de;
      border-radius: 10px;
      font-size: 0.95rem;
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #1a1a1a;
      transition: border-color 0.15s;
    }
    .search-input:focus {
      outline: none;
      border-color: #c9a96e;
    }
    .pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }
    .pill {
      padding: 6px 16px;
      border-radius: 9999px;
      border: 1px solid #e8e4de;
      background: #fff;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      color: #6b6b6b;
    }
    .pill:hover { border-color: #c9a96e; color: #1a1a1a; }
    .pill.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
      gap: 24px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s, transform 0.2s;
      border: 1px solid #f0eeea;
    }
    .card:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,0.11);
      transform: translateY(-3px);
    }
    .card-img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      display: block;
    }
    .card-body { padding: 16px 18px 20px; }
    .card-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .card-price {
      font-size: 1.05rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .card-seller {
      font-size: 0.78rem;
      color: #6b6b6b;
      margin-bottom: 8px;
    }
    .card-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .tag {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.isLoading = true;
    this.searchTerm = '';
    this.filteredItems = [];
    this.selectedCategory = 'All';
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
    this.filteredItems = this.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);
      const matchesCategory = this.selectedCategory === 'All' || item.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  highlightMatch(text, term) {
    if (!term) return html`${text}`;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return html`${text}`;
    return html`${text.slice(0, idx)}<strong>${text.slice(idx, idx + term.length)}</strong>${text.slice(idx + term.length)}`;
  }

  filterByCategory(category) {
    this.selectedCategory = category;
    this.filteredItems = this.items.filter(item => {
      const matchesSearch = !this.searchTerm ||
        item.name.toLowerCase().includes(this.searchTerm) ||
        item.description.toLowerCase().includes(this.searchTerm);
      const matchesCategory = category === 'All' || item.category === category;
      return matchesSearch && matchesCategory;
    });
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

        <div class="pills">
          ${['All','Comics & Cards','Antique Furniture','Jewelry','Art & Memorabilia','Toys','Literature','Luxury Experience','Other'].map(cat => html`
            <button class="pill ${this.selectedCategory === cat ? 'active' : ''}"
              @click=${() => this.filterByCategory(cat)}>
              ${cat}
            </button>
          `)}
        </div>

        ${this.filteredItems.length === 0 ? html`
          <div style="text-align:center;padding:5rem 2rem">
            <div style="font-size:3rem;margin-bottom:16px">🔍</div>
            <h3 style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#1a1a1a;margin-bottom:8px">
              Nothing here yet
            </h3>
            <p style="color:#6b6b6b;font-size:0.9rem">
              ${this.searchTerm ? `No results for "${this.searchTerm}"` : 'Check back soon for new listings'}
            </p>
          </div>
          ` : html`
          <div class="grid">
            ${this.filteredItems.map(item => html`
              <div class="card" @click=${() => this.viewItem(item.id)}>
                <img class="card-img" src="${item.image}" alt="${item.name}"
                  onerror="this.src='https://placehold.co/300x220?text=No+Image'" />
                <div class="card-body">
                  <div class="card-title">${this.highlightMatch(item.name, this.searchTerm)}</div>
                  <div class="card-price">KES ${item.price.toLocaleString()}</div>
                  ${item.highestOffer ? html`
                    <div style="font-size:0.78rem;color:#c9a96e;font-weight:500;margin-bottom:2px">
                      Offer: KES ${item.highestOffer.toLocaleString()}
                    </div>
                  ` : ''}
                  <div class="card-seller">
                    by ${item.sellerName}
                    ${item.sellerAvgRating ? html`· ⭐ ${item.sellerAvgRating}` : ''}
                  </div>
                  <div class="card-meta">
                    ${item.condition ? html`
                      <span class="tag" style="background:#f0ebff;color:#6b21a8">${item.condition}</span>
                    ` : ''}
                    ${item.category ? html`
                      <span class="tag" style="background:#fdf3e0;color:#92610a">${item.category}</span>
                    ` : ''}
                    ${item.paymentStatus === 'paid' ? html`
                      <span class="tag" style="background:#e6f4ec;color:#2e7d52">Confirmed</span>
                    ` : item.highestOffer ? html`
                      <span class="tag" style="background:#fef9c3;color:#854d0e">Offer Pending</span>
                    ` : ''}
                  </div>
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
