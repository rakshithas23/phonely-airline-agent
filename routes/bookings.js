const express = require('express');
const router = express.Router();
const { createBooking, getBooking } = require('../data/bookings');

const PHONELY_API = 'https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment';

router.post('/create', async (req, res) => {
  const { flightId, origin, destination, date, passenger, seat_class = 'economy', flight } = req.body;

  if (!passenger?.full_name) return res.status(400).json({ error: 'Passenger full name is required.' });
  if (!passenger?.contact) return res.status(400).json({ error: 'Passenger contact is required.' });

  const isUSPhone = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(passenger.contact);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);
  if (!isUSPhone && !isEmail) return res.status(400).json({ error: 'Invalid contact info', message: 'Please provide a valid US phone number or email address.' });
  passenger.contact_type = isUSPhone ? 'sms' : 'email';

  // Call real Phonely booking API
  const url = `${PHONELY_API}?src=${origin}&dst=${destination}&date=${date}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flightId,
      passenger: { firstName: passenger.full_name.split(' ')[0], lastName: passenger.full_name.split(' ').slice(1).join(' ') },
      date
    })
  });

  const data = await response.json();

  // Create local booking record with confirmation number
  const booking = createBooking({ flight: { ...flight, flight_id: flightId }, passenger, seat_class });

  return res.status(201).json({
    success: true,
    message: `Booking confirmed! Your confirmation number is ${booking.confirmation_number}.`,
    booking,
    phonely_response: data
  });
});

router.get('/:confirmation', (req, res) => {
  const booking = getBooking(req.params.confirmation);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  return res.json(booking);
});

module.exports = router;
