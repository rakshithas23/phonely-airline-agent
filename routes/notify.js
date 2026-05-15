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

  try {
    if (isEmail) {
      await resend.emails.send({
        from: 'onboarding@resend.dev', 
        to: passenger.contact,
        subject: `Booking Confirmed – ${confNum}`,
        text: plainText,
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