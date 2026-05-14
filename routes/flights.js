const express = require('express');
const router = express.Router();
const { generateFlights } = require('../data/flights');
const { resolveAirport } = require('../data/airports');

/**
 * POST /api/flights/search
 * Body: { "origin": "LAX", "destination": "JFK", "date": "2026-06-15" }
 *   OR: { "origin_city": "Los Angeles", "destination_city": "New York", "date": "2026-06-15" }
 * Returns: list of available flights or 404 if none
 */
router.post('/search', (req, res) => {
  let { origin, destination, date, origin_city, destination_city } = req.body;

  // Auto-resolve cities if IATA not provided directly
  if (!origin && origin_city) {
    const r = resolveAirport(origin_city);
    if (!r.found) {
      return res.status(404).json({
        error: 'Origin airport not found',
        message: `Unknown city or airport: "${origin_city}"`,
      });
    }
    origin = r.iata;
  }

  if (!destination && destination_city) {
    const r = resolveAirport(destination_city);
    if (!r.found) {
      return res.status(404).json({
        error: 'Destination airport not found',
        message: `Unknown city or airport: "${destination_city}"`,
      });
    }
    destination = r.iata;
  }

  // Validate required fields
  if (!origin || !destination || !date) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['origin (IATA or origin_city)', 'destination (IATA or destination_city)', 'date (YYYY-MM-DD)'],
    });
  }

  // Validate date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const travelDate = new Date(date);

  if (isNaN(travelDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date',
      message: 'Date must be in YYYY-MM-DD format.',
    });
  }

  if (travelDate < today) {
    return res.status(400).json({
      error: 'Invalid date',
      message: 'Travel date must be today or in the future.',
    });
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (travelDate > oneYearFromNow) {
    return res.status(400).json({
      error: 'Invalid date',
      message: 'Travel date must be within one year from today.',
    });
  }

  // Generate flights
  const flights = generateFlights(origin.toUpperCase(), destination.toUpperCase(), date);

  if (flights.length === 0) {
    return res.status(404).json({
      error: 'No flights available',
      message: `No flights found from ${origin.toUpperCase()} to ${destination.toUpperCase()} on ${date}. Please try a different route or date.`,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date,
    });
  }

  return res.json({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    date,
    flights_count: flights.length,
    flights,
  });
});

module.exports = router;