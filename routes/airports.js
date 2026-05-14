const express = require('express');
const router = express.Router();
const { resolveAirport } = require('../data/airports');

router.post('/resolve', (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'Missing required field: city' });
  }

  const result = resolveAirport(city);

  if (!result.found) {
    return res.status(404).json({
      error: 'Airport not found',
      message: `We could not find an airport for "${city}". Please try a major city name or IATA code.`,
      city,
    });
  }

  return res.json({
    city,
    iata: result.iata,
    found: true,
  });
});

router.get('/resolve', (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Missing query param: city' });
  }

  const result = resolveAirport(city);

  if (!result.found) {
    return res.status(404).json({
      error: 'Airport not found',
      message: `We could not find an airport for "${city}".`,
      city,
    });
  }

  return res.json({ city, iata: result.iata, found: true });
});

module.exports = router;