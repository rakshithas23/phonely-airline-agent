const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const { getBooking } = require('../data/bookings');

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/send', async (req, res) => {
  const { confirmation_number, booking: bookingPayload } = req.body;
  let booking = bookingPayload;
  if (!booking && confirmation_number) booking = getBooking(confirmation_number);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { passenger, flight, confirmation_number: confNum, seat_class, price_usd } = booking;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);

  const message = `SkyLine Airlines – Booking Confirmed!

Confirmation: ${confNum}
Passenger: ${passenger.full_name}
Class: ${seat_class}
Price: $${price_usd} USD

Flight: ${flight.flight_number} (${flight.airline})
From: ${flight.origin} → ${flight.destination}
Date: ${flight.departure_date}
Departs: ${flight.departure_time} | Arrives: ${flight.arrival_time}

Thank you for flying with SkyLine Airlines!`;

  if (isEmail) {
    const { error } = await resend.emails.send({
      from: 'SkyLine Airlines <onboarding@resend.dev>',
      to: passenger.contact,
      subject: `Booking Confirmed - ${confNum} | SkyLine Airlines`,
      text: message
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, channel: 'Email', sent_to: passenger.contact });
  } else {
    // SMS - log for now, Twilio in production
    console.log(`[SMS] To ${passenger.contact}:\n${message}`);
    return res.json({ success: true, channel: 'SMS (logged)', sent_to: passenger.contact, message });
  }
});

module.exports = router;