const express = require('express');
const app = express();
app.use(express.json());

const airportRoutes = require('./routes/airports');
const flightRoutes = require('./routes/flights');
const bookingRoutes = require('./routes/bookings');
const notifyRoutes = require('./routes/notify');

app.use('/api/airports', airportRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notify', notifyRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Airline Voice Agent API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));