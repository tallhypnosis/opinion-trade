const path = require('path'); // Add this line at the top

require('dotenv').config({
  path: path.join(__dirname, 'config', '.env')
});
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/opinion_trading';
const API_FOOTBALL_KEY = process.env.API_KEY || 'cbbaec8c72bd82555a08ca914eb8af05';
const API_FOOTBALL_URL = process.env.API_FOOTBALL_URL || 'https://v3.football.api-sports.io';

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

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
