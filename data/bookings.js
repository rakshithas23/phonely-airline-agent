const bookings = new Map();
function generateConfirmationNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create a new booking
 */
function createBooking({ flight, passenger, seat_class = 'economy' }) {
  const confirmation = generateConfirmationNumber();
  const price = seat_class === 'business' ? flight.price_business : flight.price_economy;

  const booking = {
    confirmation_number: confirmation,
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
    flight: {
      flight_id: flight.flight_id,
      flight_number: flight.flight_number,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      departure_date: flight.departure_date,
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
    },
    passenger: {
      full_name: passenger.full_name,
      contact: passenger.contact, // email or phone
      contact_type: passenger.contact_type, // 'email' or 'sms'
    },
    seat_class,
    price_usd: price,
  };

  bookings.set(confirmation, booking);
  return booking;
}

/**
 * Retrieve a booking by confirmation number
 */
function getBooking(confirmation) {
  return bookings.get(confirmation.toUpperCase()) || null;
}

module.exports = { createBooking, getBooking };