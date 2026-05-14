const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { getBooking } = require('../data/bookings');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

router.post('/send', async (req, res) => {
  const { confirmation_number, booking: bookingPayload } = req.body;
  let booking = bookingPayload;
  if (!booking && confirmation_number) booking = getBooking(confirmation_number);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { passenger, flight, confirmation_number: confNum, seat_class, price_usd } = booking;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.contact);

  const message = `SkyLine Airlines – Booking Confirmed!\n\nConfirmation: ${confNum}\nPassenger: ${passenger.full_name}\nClass: ${seat_class}\nPrice: $${price_usd} USD\n\nFlight: ${flight.flight_number} (${flight.airline})\nFrom: ${flight.origin} → ${flight.destination}\nDate: ${flight.departure_date}\nDeparts: ${flight.departure_time} | Arrives: ${flight.arrival_time}`;

  if (isEmail) {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: passenger.contact,
      subject: `SkyLine Airlines Booking Confirmation - ${confNum}`,
      text: message
    });
    return res.json({ success: true, channel: 'Email', sent_to: passenger.contact });
  } else {
    console.log(`[SMS] Would send to ${passenger.contact}:\n${message}`);
    return res.json({ success: true, channel: 'SMS (logged)', sent_to: passenger.contact, message });
  }
});

module.exports = router;
