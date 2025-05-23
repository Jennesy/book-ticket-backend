require('module-alias/register');
require('dotenv').config();
const express             = require('express');
const connectDB           = require('~/config/db');
const seatRoutes          = require('~/routes/seatRoutes');
const reservationRoutes   = require('~/routes/reservationRoutes');

const app = express();
app.use(express.json());

connectDB();

app.use('/api/seats', seatRoutes);
app.use('/api/reserve', reservationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
