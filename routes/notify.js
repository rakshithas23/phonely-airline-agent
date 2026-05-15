const express = require('express');
const router = express.Router();
const { getBooking } = require('../data/bookings');
const { Resend } = require('resend');
const twilio = require('twilio');

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

router.post('/send', async (req, res) => {
  const { confirmation_number, booking: bookingPayload } = req.body;
  let booking = bookingPayload;
  if (!booking && confirmation_number) booking = getBooking(confirmation_number);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { passenger, flight, confirmation_number: confNum, seat_class, price_usd } = booking;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);

  const plainText = `SkyLine Airlines – Booking Confirmed!\n\nConfirmation: ${confNum}\nPassenger: ${passenger.full_name}\nClass: ${seat_class}\nPrice: $${price_usd} USD\n\nFlight: ${flight.flight_number} (${flight.airline})\nFrom: ${flight.origin} → ${flight.destination}\nDate: ${flight.departure_date}\nDeparts: ${flight.departure_time} | Arrives: ${flight.arrival_time}`;

  const htmlBody = `
    <h2>SkyLine Airlines – Booking Confirmed! ✈️</h2>
    <p><strong>Confirmation:</strong> ${confNum}</p>
    <p><strong>Passenger:</strong> ${passenger.full_name}</p>
    <p><strong>Class:</strong> ${seat_class}</p>
    <p><strong>Price:</strong> $${price_usd} USD</p>
    <hr/>
    <p><strong>Flight:</strong> ${flight.flight_number} (${flight.airline})</p>
    <p><strong>From:</strong> ${flight.origin} → ${flight.destination}</p>
    <p><strong>Date:</strong> ${flight.departure_date}</p>
    <p><strong>Departs:</strong> ${flight.departure_time} | <strong>Arrives:</strong> ${flight.arrival_time}</p>
  `;

  try {
    if (isEmail) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',       // ← use this until you verify a domain
        to: passenger.contact,
        subject: `Booking Confirmed – ${confNum}`,
        html: htmlBody,
        text: plainText,                      // fallback for plain-text email clients
      });
    } else {
      await twilioClient.messages.create({
        body: plainText,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: passenger.contact,
      });
    }

    return res.json({ success: true, channel: isEmail ? 'email' : 'sms', sent_to: passenger.contact });
  } catch (err) {
    console.error('[notify/send] Delivery error:', err.message);
    return res.status(502).json({ error: 'Notification delivery failed', message: err.message });
  }
});

module.exports = router;
