const express = require('express');
const app = express();
app.use(express.json());

const airportRoutes = require('./routes/airports');
const flightRoutes = require('./routes/flights');
const bookingRoutes = require('./routes/bookings');

app.use('/api/airports', airportRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Airline Voice Agent API' }));

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Global error handler — catches any unhandled errors from routes
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));