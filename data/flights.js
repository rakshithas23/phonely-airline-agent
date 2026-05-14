const AIRLINES = [
  { name: "SkyWings Air", code: "SW" },
  { name: "Pacific Express", code: "PE" },
  { name: "Atlantic Blue", code: "AB" },
  { name: "Horizon Airlines", code: "HA" },
  { name: "Coastal Airways", code: "CA" },
];

// Routes with NO flights (404 test cases)
const NO_FLIGHT_ROUTES = [
  "AAL-YVR", // as specified in the task
];

/**
 * Generate deterministic mock flights for a route+date
 */
function generateFlights(origin, destination, date) {
  const routeKey = `${origin}-${destination}`;

  // Check for blacklisted routes (404 test case)
  if (NO_FLIGHT_ROUTES.includes(routeKey)) {
    return [];
  }

  // Seed randomness based on route+date for consistency
  const seed = (origin + destination + date).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (n) => (seed * 9301 + 49297) % 233280 / 233280 * n;

  const numFlights = 2 + Math.floor(rand(3)); // 2–4 flights
  const flights = [];

  const basePrices = { economy: 150 + Math.floor(rand(400)), business: 450 + Math.floor(rand(800)) };

  for (let i = 0; i < numFlights; i++) {
    const airline = AIRLINES[(seed + i) % AIRLINES.length];
    const flightNum = `${airline.code}${100 + ((seed + i * 37) % 900)}`;
    const depHour = 6 + ((seed + i * 5) % 14); // 6am–8pm
    const depMin = [0, 15, 30, 45][(seed + i) % 4];
    const duration = 90 + ((seed + i * 13) % 480); // 1.5h–9.5h
    const arrDate = new Date(`${date}T${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}:00`);
    arrDate.setMinutes(arrDate.getMinutes() + duration);

    flights.push({
      flight_id: `${flightNum}-${date}`,
      flight_number: flightNum,
      airline: airline.name,
      origin,
      destination,
      departure_date: date,
      departure_time: `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`,
      arrival_time: `${String(arrDate.getHours()).padStart(2, '0')}:${String(arrDate.getMinutes()).padStart(2, '0')}`,
      duration_minutes: duration,
      price_economy: basePrices.economy + i * 25,
      price_business: basePrices.business + i * 75,
      seats_available: 10 + ((seed + i * 7) % 90),
    });
  }

  return flights.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
}

module.exports = { generateFlights };