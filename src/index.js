require('module-alias/register');
require('dotenv').config();
const express             = require('express');
const cors                = require('cors');
const http                = require('http');
const { Server }          = require('socket.io');
const connectDB           = require('~/config/db');
const seatRoutes          = require('~/routes/seatRoutes');
const reservationRoutes   = require('~/routes/reservationRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration
const isDev = process.env.NODE_ENV !== 'production';
const CLIENT_ORIGINS = isDev ? '*' : process.env.CLIENT_ORIGINS?.split(',') || [];

app.use(cors({
  origin: CLIENT_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ['GET', 'POST']
  }
});

io.on('connection', socket => {
  console.log('⚡️ Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Make io available globally for controllers
global.io = io;

connectDB();

app.use('/api/seats', seatRoutes);
app.use('/api/reserve', reservationRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
