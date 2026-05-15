const express = require('express');
const router = express.Router();
const { createBooking, getBooking } = require('../data/bookings');

const PHONELY_API = 'https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment';

router.post('/create', async (req, res) => {
  const flightId = req.body.flightId || req.body.flight_id || req.body.flight?.flightId;
  const { origin, destination, date, passenger, seat_class = 'economy' } = req.body;
  const flightDetails = req.body.flight || {};

  if (!flightId) return res.status(400).json({ error: 'flightId is required.' });
  if (!origin || !destination || !date) return res.status(400).json({ error: 'origin, destination, and date are required.' });
  if (!passenger?.full_name) return res.status(400).json({ error: 'Passenger full name is required.' });
  if (!passenger?.contact) return res.status(400).json({ error: 'Passenger contact is required.' });

  const isUSPhone = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(passenger.contact);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);
  if (!isUSPhone && !isEmail) return res.status(400).json({ error: 'Invalid contact info. Provide a US phone number or email address.' });
  passenger.contact_type = isUSPhone ? 'sms' : 'email';
  const bookUrl = `${PHONELY_API}?src=${origin}&dst=${destination}&date=${date}`;
  let bookData;

  try {
    const bookResponse = await fetch(bookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flightId,
        passenger: {
          firstName: passenger.full_name.split(' ')[0],
          lastName: passenger.full_name.split(' ').slice(1).join(' ') || '.',
        },
        date,
      }),
    });
    bookData = await bookResponse.json();
  } catch (err) {
    console.error('[bookings/create] Upstream error:', err.message);
    return res.status(502).json({ error: 'Upstream API error', message: 'Could not complete the booking. Please try again.' });
  }

  // Build local booking — use passed-in flight details if available, fallback to bookData
  const booking = createBooking({
  flight: {
    flightId,
    flightNumber: bookData?.flightNumber || flightDetails.flightNumber,
    airline: bookData?.airline || flightDetails.airline,
    origin,
    destination,
    departure_date: date,
    departureTime: bookData?.departureTime || flightDetails.departureTime,
    arrivalTime: bookData?.arrivalTime || flightDetails.arrivalTime,
    price: bookData?.price || flightDetails.price,
  },
  passenger,
  seat_class,
});

  return res.status(200).json({
    success: true,
    message: `Booking confirmed! Your confirmation number is ${booking.confirmation_number}.`,
    booking,
    phonely_response: bookData,
  });
});

router.get('/:confirmation', (req, res) => {
  const booking = getBooking(req.params.confirmation);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  return res.json(booking);
});

module.exports = router;
