require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    .catch(err => console.error(err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: {type: String, enum: ['admin', 'user'], default: 'user'}
})
const User = mongoose.model('User', UserSchema);

// Event Schema
const EventSchema = new mongoose.Schema({
    eventId: Number,
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
    if (!token) return res.status(401).json({message: 'Access denied'});
    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({message: 'Invalid token'});
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required'});
    next();
};

// Auth Routes
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({username, password: hashedPassword, role});
    await user.save();
    res.json({ message: 'User registered'});
});


app.post('/login', async (req, res) => {
    const {username, password } = req.body;
    const user = await User.findOne({ username});
    if(!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({message: 'Invalid credentials'});
    }
    const token = jwt.sign({id: user._id, role: user.role}, JWT_SECRET, { expiresIn: '1h'});
    console.log(`---${token}---${user.username}`);

    res.json({ token });
});

//Admin Routes
app.post('/admin/events', authenticate, isAdmin, async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.json({ message: 'Event created'}); 
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
            
            // Emit event update to clients
            io.emit('eventUpdate', updatedEvent);
        }
        console.log('Events Updated');
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

// API Routes
app.get('/events', async (req, res) => {
    const events = await Event.find();
    res.json(events);
});

app.get('/events/:id', async (req, res) => {
    const event = await Event.findOne({ eventId: req.params.id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    fetchEvents(); // Initial fetch
    setInterval(fetchEvents, 60000); // Fetch data every 1 minute
});
