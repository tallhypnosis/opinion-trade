require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


const PORT = process.env.PORT ;
const MONGO_URI = process.env.MONGO_URI ;
const API_FOOTBALL_KEY = process.env.API_KEY ;
const API_FOOTBALL_URL = process.env.API_URL ;
const JWT_SECRET = process.env.JWT_SECRET ;


// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => logger.error(`MongoDB Connection Error: ${err.message}`));

// User Schema
const UserSchema = new mongoose.Schema({
    username: {type: String, unique:true, required:true},
    password: {type: String, require: true},
    role: {type: String, enum: ['admin', 'user'], default: 'user'},
    balance: {type: Number, default: 1000 }
})
const User = mongoose.model('User', UserSchema);

// Trade Schema
const TradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index:true },
    eventId: { type: Number, required:true, index:true },
    amount: { type: Number, required: true},
    prediction: { type: String, required: true},
    status: {type: String, enum: ['pending', 'won', 'lost'], default: 'pending'}    
});
const Trade = mongoose.model('Trade', TradeSchema);

// Event Schema
const EventSchema = new mongoose.Schema({
    eventId: { type: Number, unique: true, required: true, index: true},
    name: String,
    category: String,
    odds: Object,
    startTime: Date,
    status: String
});

const Event = mongoose.model('Event', EventSchema);

// Auth Middleware
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        logger.warn("Unauthorized access attempt");
        return res.status(401).json({message: 'Access denied'});
    }
    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        logger.error("Invalid token access attempt");
        res.status(400).json({message: 'Invalid token'});
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required'});
    next();
};

// Place Trade Route
app.post('/trade', authenticate, async (req, res) => {
    try {
        const { eventId, amount, prediction } = req.body;
        const user = await User.findById(req.user.id);

        if (user.balance < amount) {
            logger.warn(`Trade failed for user ${user.username}: Insufficient balance`);
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const trade = new Trade({ userId: user._id, eventId, amount, prediction });
        await trade.save();

        user.balance -= amount;
        await user.save();

        logger.info(`Trade placed: User ${user.username}, Event ${eventId}, Amount ${amount}`);
        res.json({ message: 'Trade placed successfully', trade });
    } catch (error) {
        logger.error(`Trade placement error: ${error.message}`);
        res.status(500).json({ message: 'Trade placement failed' });
    }
});

// Settle Trade (Admin Only)
app.post('/settle/:eventId', authenticate, isAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { outcome } = req.body;
        const trades = await Trade.find({ eventId, status: 'pending' });

        for (let trade of trades) {
            const user = await User.findById(trade.userId);
            if (trade.prediction === outcome) {
                trade.status = 'won';
                user.balance += trade.amount * 2;
            } else {
                trade.status = 'lost';
            }
            await trade.save();
            await user.save();
        }

        logger.info(`Trades settled for Event ID ${eventId} with outcome ${outcome}`);
        res.json({ message: 'Trades settled successfully' });
    } catch (error) {
        logger.error(`Error settling trades: ${error.message}`);
        res.status(500).json({ message: 'Error settling trades' });
    }
});



// Auth Routes
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({username, password: hashedPassword, role});
    await user.save();
    logger.info(`User ${username} registered `);
    res.json({ message: 'User registered'});
});


app.post('/login', async (req, res) => {
    const {username, password } = req.body;
    const user = await User.findOne({ username});
    if(!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({message: 'Invalid credentials'});
    }
    const token = jwt.sign({id: user._id, role: user.role}, JWT_SECRET, { expiresIn: '1h'});
    logger.info(`User ${user.username} logged in`);

    res.json(token);
});

//Admin Routes
app.post('/admin/events', authenticate, isAdmin, async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    logger.info('Event created successfully');
    res.json(event); 
});

// Fetch Events from API-Football 
const fetchEvents = async () => {
    try {
        const response = await axios.get(`${API_FOOTBALL_URL}/fixtures?live=all`, {
            headers: { 'x-apisports-key': API_FOOTBALL_KEY }
        });
        const events = response.data.response;

        for (let event of events) {
            const updatedEvent = await Event.findOneAndUpdate(
                { eventId: event.fixture.id },
                {
                    name: event.teams.home.name + ' vs ' + event.teams.away.name,
                    category: event.league.name,
                    odds: event.odds || {},
                    startTime: new Date(event.fixture.date),
                    status: event.fixture.status.short
                },
                { upsert: true, new: true }
            );

            io.emit('eventUpdate', updatedEvent);
        }

        logger.info('Events updated successfully');
    } catch (error) {
        logger.error(`Error fetching events: ${error.message}`);
    }
};

// API Routes 
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find();
        logger.info('Events fetched successfully');
        res.json(events);
    } catch (error) {
        logger.error(`Error fetching events: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});


app.get('/events/:id', async (req, res) => {
    try {
        const event = await Event.findOne({ eventId: req.params.id });
        if (!event) {
            logger.warn(`Event not found: ID ${req.params.id}`);
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        logger.error(`Error fetching event ${req.params.id}: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch event' });
    }
});

// WebSocket 
io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    fetchEvents(); 
    setInterval(fetchEvents, 60000); 
});
