import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import itemsRouter from './routes/items.js';
import usersRouter from './routes/users.js';
import messagesRouter from './routes/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Serve static files from the public directory  
app.use(express.static(join(__dirname, 'public')));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Ensure data directory exists
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize data files with sample data
const initDataFiles = () => {
  // Items data
  const itemsPath = join(dataDir, 'items.json');
  if (!existsSync(itemsPath)) {
    const sampleItems = [
      {
        id: '1',
        name: 'Vintage Comic Book - Spider-Man #1',
        description: 'Rare collectible comic in mint condition, never opened',
        price: 500,
        image: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400',
        sellerId: 'user1',
        sellerName: 'ComicCollector',
        status: 'active',
        highestOffer: null,
        highestOfferBuyer: null,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Limited Edition Funko Pop - Batman',
        description: 'Rare convention exclusive, still in original box',
        price: 150,
        image: 'https://images.unsplash.com/photo-1581235725079-7c7783e6a2df?w=400',
        sellerId: 'user2',
        sellerName: 'ToyTrader',
        status: 'active',
        highestOffer: null,
        highestOfferBuyer: null,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Pokemon Card - Charizard Holo',
        description: 'First edition, graded PSA 9, extremely rare',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1621274403997-37aace184f49?w=400',
        sellerId: 'user3',
        sellerName: 'CardMaster',
        status: 'active',
        highestOffer: null,
        highestOfferBuyer: null,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Star Wars Action Figure - Darth Vader',
        description: '1977 original, still in packaging',
        price: 850,
        image: 'https://images.unsplash.com/photo-1608889476561-6242cfdbf4f2?w=400',
        sellerId: 'user1',
        sellerName: 'ComicCollector',
        status: 'active',
        highestOffer: null,
        highestOfferBuyer: null,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Magic: The Gathering - Black Lotus',
        description: 'Limited edition, near mint condition',
        price: 3000,
        image: 'https://images.unsplash.com/photo-1616901826816-7045fc2e8a8d?w=400',
        sellerId: 'user2',
        sellerName: 'ToyTrader',
        status: 'active',
        highestOffer: null,
        highestOfferBuyer: null,
        createdAt: new Date().toISOString()
      }
    ];
    writeFileSync(itemsPath, JSON.stringify(sampleItems, null, 2));
  }

  // Users data
  const usersPath = join(dataDir, 'users.json');
  if (!existsSync(usersPath)) {
    const sampleUsers = [
      { id: 'user1', name: 'ComicCollector', createdAt: new Date().toISOString() },
      { id: 'user2', name: 'ToyTrader', createdAt: new Date().toISOString() },
      { id: 'user3', name: 'CardMaster', createdAt: new Date().toISOString() }
    ];
    writeFileSync(usersPath, JSON.stringify(sampleUsers, null, 2));
  }

  // Messages data
  const messagesPath = join(dataDir, 'messages.json');
  if (!existsSync(messagesPath)) {
    const sampleMessages = [
      {
        id: 'msg1',
        itemId: '1',
        senderId: 'user2',
        senderName: 'ToyTrader',
        content: 'Is this comic still available?',
        type: 'text',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'msg2',
        itemId: '1',
        senderId: 'user1',
        senderName: 'ComicCollector',
        content: 'Yes, it is! Interested?',
        type: 'text',
        timestamp: new Date(Date.now() - 86000000).toISOString()
      },
      {
        id: 'msg3',
        itemId: '1',
        senderId: 'user2',
        senderName: 'ToyTrader',
        content: '450',
        type: 'offer',
        price: 450,
        originalPrice: 500,
        status: 'pending',
        timestamp: new Date(Date.now() - 85000000).toISOString()
      }
    ];
    writeFileSync(messagesPath, JSON.stringify(sampleMessages, null, 2));
  }
};

initDataFiles();

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/users', usersRouter);
app.use('/api/messages', messagesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Homepage
app.get('/', (req, res) => {
    res.render('index', { 
        apiBase: '/api',
        user: null  // In real app, we'll get from session
    });
});

// Item detail page
app.get('/item/:id', (req, res) => {
  res.render('item', { 
    apiBase: '/api',
    title: 'Item Details',
    itemId: req.params.id,
    user: null 
  });
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { 
        apiBase: '/api'
    });
});

// Seller dashboard
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { 
        apiBase: '/api',
        user: null
    });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});