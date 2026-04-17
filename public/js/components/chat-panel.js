import { LitElement, html, css } from 'lit';

class ChatPanel extends LitElement {
  static properties = {
    apiBase: { type: String, attribute: 'api-base' },
    itemId: { type: String, attribute: 'item-id' },
    currentUser: { type: Object },
    sellerName: { type: String },
    messages: { type: Array },
    newMessage: { type: String },
    isLoading: { type: Boolean },
    lastTimestamp: { type: String }
  };

  static styles = css`
    .chat-container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 16px;
      background: white;
    }
    .messages {
      height: 300px;
      overflow-y: auto;
      padding: 16px;
    }
    .message {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
    }
    .message-sent {
      align-items: flex-end;
    }
    .message-received {
      align-items: flex-start;
    }
    .bubble {
      max-width: 70%;
      padding: 8px 12px;
      border-radius: 12px;
    }
    .bubble-sent {
      background: #3b82f6;
      color: white;
    }
    .bubble-received {
      background: #f3f4f6;
      color: #1f2937;
    }
    .sender-name {
      font-size: 0.75rem;
      margin-bottom: 4px;
      color: #6b7280;
    }
    .timestamp {
      font-size: 0.7rem;
      margin-top: 4px;
      color: #9ca3af;
    }
    .input-area {
      display: flex;
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      gap: 8px;
    }
    .message-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
    }
    .send-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
    }
    .offer-message {
      background: #fef3c7;
      color: #92400e;
    }
  `;

  constructor() {
    super();
    this.messages = [];
    this.newMessage = '';
    this.isLoading = true;
    this.lastTimestamp = new Date().toISOString();
    this.pollInterval = null;
    this.currentUser = null;
  }

  connectedCallback() {
    super.connectedCallback();

    const base = this.getAttribute('api-base');
    if (base) this.apiBase = base;

    const itemId = this.getAttribute('item-id');
    if (itemId) this.itemId = itemId;

    // Read current-user from attribute (passed by item-detail)
    const userAttr = this.getAttribute('current-user');
    if (userAttr && userAttr !== '') {
      try { this.currentUser = JSON.parse(userAttr); } catch {}
    } else {
      const stored = localStorage.getItem('curioCoveUser');
      if (stored) this.currentUser = JSON.parse(stored);
    }

    this.loadMessages().then(() => this.startPolling());
  }


  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async loadMessages() {
    try {
      const response = await fetch(
        `${this.apiBase}/messages/item/${this.itemId}/poll/${this.lastTimestamp}`
      );
      if (response.ok) {
        const data = await response.json();
        this.messages = data.messages || [];
        if (this.messages.length > 0) {
          this.lastTimestamp = data.lastTimestamp;
        }
        await this.markAsRead();
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async pollForNewMessages() {
    try {
      const response = await fetch(
        `${this.apiBase}/messages/item/${this.itemId}/poll/${this.lastTimestamp}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.hasNew) {
          this.messages = [...this.messages, ...data.messages];
          this.lastTimestamp = data.lastTimestamp;
          await this.markAsRead();
          this.scrollToBottom();
        }
      }
    } catch { /* silently retry */  }
  }

  startPolling() {
    this.pollInterval = setInterval(() => 
      this.pollForNewMessages(),
     2000);
  }

  async markAsRead() {
    if (!this.currentUser) return;
    
    try {
      await fetch(`${this.apiBase}/messages/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          itemId: this.itemId
        })
      });
    } catch {}
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUser) return;
    const text = this.newMessage;
    this.newMessage = '';
    
    try {
      await fetch(`${this.apiBase}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: this.itemId,
          senderId: this.currentUser.id,
          senderName: this.currentUser.name,
          content: text,
          type: 'text'
        })
      });
      
      //immediately poll instead of waiting
      await this.pollForNewMessages();
    } catch { this.newMessage = text;}
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = this.shadowRoot?.querySelector('.messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    date.setHours(date.getHours() + 3); // Added 3 hours for UTC+3 timezone
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' });
  }

  render() {
    if (this.isLoading) {
      return html`<div class="chat-container" style="padding:1rem;text-align:center">Loading chat...</div>`;
    }

    return html`
      <div class="chat-container">
        <div class="messages">
          ${this.messages.length === 0 ? html`
            <div style="text-align:center;color:#9ca3af;padding:2rem">
              No messages yet — start the conversation!
            </div>
          ` : ''}
          ${this.messages.map(msg => {
            const isSent  = this.currentUser && msg.senderId === this.currentUser.id;
            const isOffer = msg.type === 'offer';
            return html`
              <div class="message ${isSent ? 'message-sent' : 'message-received'}">
                ${!isSent ? html`<span class="sender-name">${msg.senderName}</span>` : ''}
                <div class="bubble ${isSent ? 'bubble-sent' : 'bubble-received'} ${isOffer ? 'bubble-offer' : ''}">
                  ${isOffer ? html`Offer: KES ${Number(msg.price).toLocaleString()}` : msg.content}
                </div>
                <span class="timestamp">${this.formatTime(msg.timestamp)}</span>
              </div>
            `;
          })}
        </div>

        <div class="input-area">
          <input
            type="text"
            class="message-input"
            placeholder=${this.currentUser ? 'Type a message...' : 'Login to chat'}
            .value=${this.newMessage}
            ?disabled=${!this.currentUser}
            @input=${(e) => this.newMessage = e.target.value}
            @keypress=${(e) => e.key === 'Enter' && this.sendMessage()}
          />
          <button @click=${this.sendMessage} class="send-btn" ?disabled=${!this.currentUser}>
            Send
          </button>
        </div>
      </div>
    `;
  }
}


customElements.define('chat-panel', ChatPanel);
