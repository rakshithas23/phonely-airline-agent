const bookings = new Map();

function generateConfirmationNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createBooking({ flight, passenger, seat_class = 'economy' }) {
  const confirmation = generateConfirmationNumber();

  const booking = {
    confirmation_number: confirmation,
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
    flight: {
      flight_id: flight.flightId || flight.flight_id,
      flight_number: flight.flightNumber || flight.flight_number,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      departure_date: flight.departure_date || flight.departureTime?.split('T')[0],
      departure_time: flight.departure_time || flight.departureTime?.split('T')[1]?.substring(0,5),
      arrival_time: flight.arrival_time || flight.arrivalTime?.split('T')[1]?.substring(0,5),
    },
    passenger: {
      full_name: passenger.full_name,
      contact: passenger.contact,
      contact_type: passenger.contact_type,
    },
    seat_class,
    price_usd: flight.price || flight.price_economy,
  };

  bookings.set(confirmation, booking);
  return booking;
}

function getBooking(confirmation) {
  return bookings.get(confirmation.toUpperCase()) || null;
}

module.exports = { createBooking, getBooking };
