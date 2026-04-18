import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const messagesPath = join(__dirname, '../data/messages.json');

const readMessages = () => {
  const data = readFileSync(messagesPath);
  return JSON.parse(data);
};

const writeMessages = (messages) => {
  writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
};


// Get new messages after timestamp (for real-time updates)
router.get('/item/:itemId/poll/:timestamp', (req, res) => {
  try {
    const messages = readMessages();
    const since = new Date(req.params.timestamp);
    const itemId = req.params.itemId;
    
    // Validate timestamp
    if (isNaN(since.getTime())) {
      return res.status(400).json({ error: 'Invalid timestamp format' });
    }
    
    const newMessages = messages.filter(m => 
      m.itemId === itemId && 
      new Date(m.timestamp) > since
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Add polling info to response
    res.json({
      messages: newMessages,
      lastTimestamp: newMessages.length > 0 ? newMessages[newMessages.length - 1].timestamp : req.params.timestamp,
      hasNew: newMessages.length > 0,
      pollAgainAfter: 2000
    });
  } catch (error) {
    console.error('Error in polling:', error);
    res.status(500).json({ error: 'Failed to fetch new messages' });
  }
});

// Get unread message count for a user
router.get('/unread/:userId', (req, res) => {
  try {
    const messages = readMessages();
    const userId = req.params.userId;
    
    // Get all messages where user is not the sender and not system messages
    const unreadMessages = messages.filter(m => 
      m.senderId !== userId && 
      m.senderId !== 'system' &&
      !m.readBy?.includes(userId)
    );
    
    // Group by item
    const unreadByItem = {};
    unreadMessages.forEach(msg => {
      if (!unreadByItem[msg.itemId]) {
        unreadByItem[msg.itemId] = 0;
      }
      unreadByItem[msg.itemId]++;
    });
    
    res.json({
      total: unreadMessages.length,
      byItem: unreadByItem
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Send a message
router.post('/', (req, res) => {
  try {
    const messages = readMessages();
    const { itemId, senderId, senderName, content, type, price, originalPrice, status } = req.body;
    
    // Add validation
    if (!itemId || !senderId || !content) {
      return res.status(400).json({ error: 'itemId, senderId, and content are required' });
    }

    const newMessage = {
      id: uuidv4(),
      itemId,
      senderId,
      senderName: senderName || 'Anonymous',
      content,
      type: type || 'text',
      timestamp: new Date().toISOString(),
      readBy: []
    };

    // Offers)
    if (type === 'offer') {
      newMessage.price = price;
      newMessage.originalPrice = originalPrice;
      newMessage.status = status || 'pending';
    }
    
    messages.push(newMessage);
    writeMessages(messages);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages for an item
router.get('/item/:itemId', (req, res) => {
  try {
    const messages = readMessages();
    const itemMessages = messages
      .filter(m => m.itemId === req.params.itemId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(itemMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// PUT /api/messages/:id  — update status (accepted / rejected)
router.put('/:id', (req, res) => {
  const messages = readMessages();
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Message not found' });
  messages[idx] = { ...messages[idx], ...req.body };
  writeMessages(messages);
  res.json(messages[idx]);
});

// Mark messages as read
router.post('/read', (req, res) => {
  try {
    const { userId, itemId, messageIds } = req.body;
    const messages = readMessages();
    
    messages.forEach(message => {
      if (message.itemId === itemId && message.senderId !== userId) {
        if (!message.readBy) message.readBy = [];
        if (!message.readBy.includes(userId)) {
          message.readBy.push(userId);
        }
      }
    });
    
    writeMessages(messages);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete a message
router.delete('/:id', (req, res) => {
  try {
    const messages = readMessages();
    const filtered = messages.filter(m => m.id !== req.params.id);
    writeMessages(filtered);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;