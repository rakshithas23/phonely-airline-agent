const express = require('express');
const router = express.Router();
const { createBooking, getBooking } = require('../data/bookings');

const PHONELY_API = 'https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment';

router.post('/create', async (req, res) => {
  // Accept both flightId and flight_id for flexibility
  const flightId = req.body.flightId || req.body.flight_id;
  const { origin, destination, date, passenger, seat_class = 'economy' } = req.body;

  if (!flightId) return res.status(400).json({ error: 'flightId is required.' });
  if (!origin || !destination || !date) return res.status(400).json({ error: 'origin, destination, and date are required.' });
  if (!passenger?.full_name) return res.status(400).json({ error: 'Passenger full name is required.' });
  if (!passenger?.contact) return res.status(400).json({ error: 'Passenger contact is required.' });

  const isUSPhone = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(passenger.contact);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);
  if (!isUSPhone && !isEmail) return res.status(400).json({ error: 'Invalid contact info. Provide a US phone number or email address.' });
  passenger.contact_type = isUSPhone ? 'sms' : 'email';

  const searchUrl = `${PHONELY_API}?src=${origin}&dst=${destination}&date=${date}`;
  let flight, bookData;

  try {
    // Fetch flight details
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    flight = searchData.flights?.find(f => f.flightId === flightId);
    if (!flight) return res.status(404).json({ error: 'Flight not found.', message: `No flight with ID "${flightId}" found on that route and date.` });

    // Book via Phonely API
    const bookResponse = await fetch(searchUrl, {
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
    return res.status(502).json({ error: 'Upstream API error', message: 'Could not complete the booking with the airline system. Please try again.' });
  }

  // Create local booking with full flight details
  const booking = createBooking({
    flight: {
      flightId,
      flightNumber: flight?.flightNumber,
      airline: flight?.airline,
      origin,
      destination,
      departure_date: date,
      departureTime: flight?.departureTime,
      arrivalTime: flight?.arrivalTime,
      price: flight?.price
    },
    passenger,
    seat_class
  });

  return res.status(201).json({
    success: true,
    message: `Booking confirmed! Your confirmation number is ${booking.confirmation_number}.`,
    booking,
    phonely_response: bookData
  });
});

router.get('/:confirmation', (req, res) => {
  const booking = getBooking(req.params.confirmation);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  return res.json(booking);
});

module.exports = router;