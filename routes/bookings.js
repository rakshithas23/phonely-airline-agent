const express = require('express');
const router = express.Router();
const { createBooking, getBooking } = require('../data/bookings');
const { resolveAirport } = require('../data/airports');

const PHONELY_API = 'https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment';

// Store last search results per session (keyed by origin+destination+date)
const searchCache = new Map();

// Helper to cache search results
function cacheKey(origin, destination, date) {
  return `${origin}-${destination}-${date}`;
}

router.post('/create', async (req, res) => {
  let { origin, destination, date, passenger, seat_class = 'economy' } = req.body;
  const selectedOption = req.body.selected_option || req.body.selectedOption;
  let flightId = req.body.flightId || req.body.flight_id;
  const flightDetails = req.body.flight || {};

  if (!origin || !destination || !date) return res.status(400).json({ error: 'origin, destination, and date are required.' });
  if (!passenger?.full_name) return res.status(400).json({ error: 'Passenger full name is required.' });
  if (!passenger?.contact) return res.status(400).json({ error: 'Passenger contact is required.' });

  const isUSPhone = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(passenger.contact);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);
  if (!isUSPhone && !isEmail) return res.status(400).json({ error: 'Invalid contact info. Provide a US phone number or email address.' });
  passenger.contact_type = isUSPhone ? 'sms' : 'email';

  // Auto-resolve city names to IATA
  if (origin.length > 3) {
    const r = resolveAirport(origin);
    if (r.found) origin = r.iata;
  }
  if (destination.length > 3) {
    const r = resolveAirport(destination);
    if (r.found) destination = r.iata;
  }
  origin = origin.toUpperCase();
  destination = destination.toUpperCase();

  // Fetch fresh flights to resolve selected_option or flightId
  let resolvedFlight = null;
  try {
    const searchUrl = `${PHONELY_API}?src=${origin}&dst=${destination}&date=${date}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const flights = searchData.flights || [];

    if (selectedOption) {
      // Caller said "Option 2" → pick index (selectedOption - 1)
      const idx = parseInt(selectedOption) - 1;
      resolvedFlight = flights[idx] || flights[0];
    } else if (flightId) {
      resolvedFlight = flights.find(f => f.flightId === flightId);
    }

    // Fallback: match by airline name if provided
    if (!resolvedFlight && flightDetails.airline) {
      resolvedFlight = flights.find(f =>
        f.airline?.toLowerCase().includes(flightDetails.airline.toLowerCase())
      );
    }

    // Last resort: cheapest flight
    if (!resolvedFlight && flights.length > 0) {
      resolvedFlight = flights.sort((a, b) => a.price - b.price)[0];
    }

    if (resolvedFlight) flightId = resolvedFlight.flightId;
  } catch (err) {
    console.error('[bookings/create] Flight lookup error:', err.message);
  }

  if (!flightId) return res.status(400).json({ error: 'Could not determine flight. Please try again.' });

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

  const f = resolvedFlight || {};
  const booking = createBooking({
    flight: {
      flightId,
      flightNumber: f.flightNumber || flightDetails.flightNumber,
      airline: f.airline || flightDetails.airline,
      origin,
      destination,
      departure_date: date,
      departureTime: f.departureTime || flightDetails.departureTime,
      arrivalTime: f.arrivalTime || flightDetails.arrivalTime,
      price: f.price || flightDetails.price,
    },
    passenger,
    seat_class,
  });

  return res.status(201).json({
    success: true,
    message: `Booking confirmed! Your confirmation number is ${booking.confirmation_number}.`,
    confirmation_number: booking.confirmation_number,
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
