const express = require('express');
const router = express.Router();
const { createBooking, getBooking } = require('../data/bookings');
const { generateFlights } = require('../data/flights');

router.post('/create', (req, res) => {
  const { flight_id, origin, destination, date, passenger, seat_class = 'economy' } = req.body;

  // Validate passenger info
  if (!passenger?.full_name) {
    return res.status(400).json({ error: 'Passenger full name is required.' });
  }
  if (!passenger?.contact) {
    return res.status(400).json({ error: 'Passenger contact (email or phone) is required.' });
  }

  // Detect contact type
  const isUSPhone = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(passenger.contact);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);

  if (!isUSPhone && !isEmail) {
    return res.status(400).json({
      error: 'Invalid contact info',
      message: 'Please provide a valid US phone number or email address.',
    });
  }

  passenger.contact_type = isUSPhone ? 'sms' : 'email';

  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'origin, destination, and date are required to look up the flight.' });
  }

  const flights = generateFlights(origin.toUpperCase(), destination.toUpperCase(), date);
  const flight = flights.find(f => f.flight_id === flight_id);

  if (!flight) {
    return res.status(404).json({
      error: 'Flight not found',
      message: `Flight ${flight_id} not found for route ${origin}-${destination} on ${date}.`,
    });
  }

  // Validate seat class
  if (!['economy', 'business'].includes(seat_class)) {
    return res.status(400).json({ error: 'seat_class must be "economy" or "business".' });
  }

  const booking = createBooking({ flight, passenger, seat_class });

  return res.status(201).json({
    success: true,
    message: `Booking confirmed! Your confirmation number is ${booking.confirmation_number}.`,
    booking,
  });
});

router.get('/:confirmation', (req, res) => {
  const { confirmation } = req.params;
  const booking = getBooking(confirmation);

  if (!booking) {
    return res.status(404).json({
      error: 'Booking not found',
      message: `No booking found with confirmation number ${confirmation}.`,
    });
  }

  return res.json(booking);
});

module.exports = router;