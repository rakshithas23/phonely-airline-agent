const express = require('express');
const router = express.Router();
const { getBooking } = require('../data/bookings');

router.post('/send', async (req, res) => {
  const { confirmation_number, booking: bookingPayload } = req.body;
  let booking = bookingPayload;
  if (!booking && confirmation_number) booking = getBooking(confirmation_number);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { passenger, flight, confirmation_number: confNum, seat_class, price_usd } = booking;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);

  const message = `SkyLine Airlines – Booking Confirmed!\n\nConfirmation: ${confNum}\nPassenger: ${passenger.full_name}\nClass: ${seat_class}\nPrice: $${price_usd} USD\n\nFlight: ${flight.flight_number} (${flight.airline})\nFrom: ${flight.origin} → ${flight.destination}\nDate: ${flight.departure_date}\nDeparts: ${flight.departure_time} | Arrives: ${flight.arrival_time}`;

  const channel = isEmail ? 'Email' : 'SMS';
  console.log(`[NOTIFY] Sending ${channel} to ${passenger.contact}:\n${message}`);

  return res.json({
    success: true,
    channel,
    sent_to: passenger.contact,
    message,
    note: isEmail
      ? 'Email confirmed. SMTP blocked on Railway — use SendGrid/Resend in production.'
      : 'SMS requires Twilio in production.'
  });
});

module.exports = router;
