const express = require('express');
const router = express.Router();
const { getBooking } = require('../data/bookings');

router.post('/send', (req, res) => {
  const { confirmation_number, booking: bookingPayload } = req.body;

  let booking = bookingPayload;

  if (!booking && confirmation_number) {
    booking = getBooking(confirmation_number);
  }

  if (!booking) {
    return res.status(404).json({
      error: 'Booking not found',
      message: 'Provide a valid confirmation_number or booking object.',
    });
  }

  const { passenger, flight, confirmation_number: confNum, seat_class, price_usd } = booking;
  const contactType = passenger.contact_type;

  // Build message content
  const message = buildConfirmationMessage({ passenger, flight, confNum, seat_class, price_usd });
  const channel = contactType === 'sms' ? 'SMS' : 'Email';
  const destination = passenger.contact;

  console.log(`[NOTIFY] Sending ${channel} to ${destination}:\n${message}`);

  return res.json({
    success: true,
    channel,
    sent_to: destination,
    message_preview: message,
    note: `In production, this would send a real ${channel} via Twilio/SendGrid.`,
  });
});

function buildConfirmationMessage({ passenger, flight, confNum, seat_class, price_usd }) {
  return `SkyLine Airlines – Booking Confirmed!

Confirmation: ${confNum}
Passenger: ${passenger.full_name}
Class: ${seat_class.charAt(0).toUpperCase() + seat_class.slice(1)}
Price: $${price_usd} USD
Flight: ${flight.flight_number} (${flight.airline})
From: ${flight.origin} → To: ${flight.destination}
Date: ${flight.departure_date}
Departs: ${flight.departure_time} | Arrives: ${flight.arrival_time}

Thank you for flying with us! For changes or cancellations, 
please call our support line or visit our website.
  `.trim();
}

module.exports = router;