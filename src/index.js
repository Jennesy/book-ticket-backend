require('module-alias/register');
require('dotenv').config();
const express             = require('express');
const cors                = require('cors');
const connectDB           = require('~/config/db');
const seatRoutes          = require('~/routes/seatRoutes');
const reservationRoutes   = require('~/routes/reservationRoutes');

const app = express();

// CORS configuration
const isDev = process.env.NODE_ENV !== 'production';
const CLIENT_ORIGINS = isDev ? '*' : process.env.CLIENT_ORIGINS?.split(',') || [];

app.use(cors({
  origin: CLIENT_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

connectDB();

app.use('/api/seats', seatRoutes);
app.use('/api/reserve', reservationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
