const express = require('express');
const router = express.Router();
const { resolveAirport } = require('../data/airports');

const PHONELY_API = 'https://zz1mpoguje.execute-api.us-east-1.amazonaws.com/default/airline-assessment';

router.post('/search', async (req, res) => {
  let { origin, destination, date, origin_city, destination_city } = req.body;

  // Auto-resolve cities to IATA
  if (!origin && origin_city) {
    const r = resolveAirport(origin_city);
    if (!r.found) return res.status(404).json({ error: 'Origin airport not found', message: `Unknown city or airport: "${origin_city}"` });
    origin = r.iata;
  }
  if (!destination && destination_city) {
    const r = resolveAirport(destination_city);
    if (!r.found) return res.status(404).json({ error: 'Destination airport not found', message: `Unknown city or airport: "${destination_city}"` });
    destination = r.iata;
  }

  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'Missing required fields: origin, destination, date' });
  }

  // Validate date — parse as local midnight to avoid UTC offset issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const travelDate = new Date(date + 'T00:00:00');
  if (isNaN(travelDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date', message: 'Date must be in YYYY-MM-DD format.' });
  }
  if (travelDate < today) {
    return res.status(400).json({ error: 'Invalid date', message: 'Travel date must be today or in the future.' });
  }
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  if (travelDate > oneYear) {
    return res.status(400).json({ error: 'Invalid date', message: 'Travel date must be within one year from today.' });
  }

  // Call Phonely API
  const url = `${PHONELY_API}?src=${origin.toUpperCase()}&dst=${destination.toUpperCase()}&date=${date}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.flights || data.flights.length === 0) {
      return res.status(404).json({
        error: 'No flights available',
        message: `No flights found from ${origin} to ${destination} on ${date}.`,
        origin,
        destination,
        date,
      });
    }

    // Build numbered options for Phonely Talk node (prompt_context)
    const prompt_context = data.flights.map((f, i) => ({
      option: i + 1,
      flightId: f.flightId,
      airline: f.airline,
      flightNumber: f.flightNumber,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      price: f.price,
    }));

    // Also expose as option1, option2 etc. for easy variable access
    const options = {};
    prompt_context.forEach(f => { options['option' + f.option] = f; });

    // Build pre-formatted speech string for Phonely to read verbatim
    const formatTime = (iso) => {
      const d = new Date(iso);
      let h = d.getUTCHours(), m = d.getUTCMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return m === 0 ? h + ' ' + ampm : h + ':' + String(m).padStart(2,'0') + ' ' + ampm;
    };

    const speech = prompt_context.map(f =>
      'Option ' + f.option + ': ' + f.airline + ', flight ' + f.flightNumber +
      ', departing at ' + formatTime(f.departureTime) +
      ', arriving at ' + formatTime(f.arrivalTime) +
      '. Price: dollar ' + f.price + '.'
    ).join(' ') + ' Which option would you like?';

    return res.json({
      success: true,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date,
      flights_count: data.flights.length,
      speech,
      ...options,
      prompt_context,
      flights: data.flights,
    });
  } catch (err) {
    console.error('[flights/search] Upstream error:', err.message);
    return res.status(502).json({ error: 'Upstream API error', message: 'Could not reach the flight availability service. Please try again.' });
  }
});

module.exports = router;