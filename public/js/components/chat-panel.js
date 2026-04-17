import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/index.js';

class ChatPanel extends LitElement {
  static properties = {
    itemId: { type: String },
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
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadMessages();
    this.startPolling();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async loadMessages() {
    try {
      const response = await fetch(`/api/messages/item/${this.itemId}`);
      if (response.ok) {
        this.messages = await response.json();
        if (this.messages.length > 0) {
          this.lastTimestamp = this.messages[this.messages.length - 1].timestamp;
        }
        await this.markAsRead();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async pollForNewMessages() {
    try {
      const response = await fetch(`/api/messages/item/${this.itemId}/poll/${this.lastTimestamp}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasNew && data.messages.length > 0) {
          this.messages = [...this.messages, ...data.messages];
          this.lastTimestamp = data.lastTimestamp;
          await this.markAsRead();
          this.scrollToBottom();
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.pollForNewMessages();
    }, 2000);
  }

  async markAsRead() {
    if (!this.currentUser) return;
    
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          itemId: this.itemId
        })
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUser) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: this.itemId,
          senderId: this.currentUser.id,
          senderName: this.currentUser.name,
          content: this.newMessage,
          type: 'text'
        })
      });
      
      if (response.ok) {
        this.newMessage = '';
        await this.loadMessages();
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const messagesDiv = this.shadowRoot.querySelector('.messages');
      if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    }, 100);
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
      return html`<div class="chat-container p-4 text-center">Loading chat...</div>`;
    }
    
    return html`
      <div class="chat-container">
        <div class="messages">
          ${this.messages.map(msg => {
            const isSent = this.currentUser && msg.senderId === this.currentUser.id;
            const isOffer = msg.type === 'offer';
            
            return html`
              <div class="message ${isSent ? 'message-sent' : 'message-received'}">
                ${!isSent ? html`<span class="sender-name">${msg.senderName}</span>` : ''}
                <div class="bubble ${isSent ? 'bubble-sent' : 'bubble-received'} ${isOffer ? 'offer-message' : ''}">
                  ${msg.content}
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
            placeholder="Type a message..."
            .value=${this.newMessage}
            @input=${(e) => this.newMessage = e.target.value}
            @keypress=${(e) => e.key === 'Enter' && this.sendMessage()}
          >
          <button @click=${this.sendMessage} class="send-btn">Send</button>
        </div>
      </div>
    `;
  }
}

customElements.define('chat-panel', ChatPanel);
