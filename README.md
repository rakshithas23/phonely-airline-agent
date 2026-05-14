# ✈️ SkyLine Airlines — Phonely Voice Agent

A complete voice booking assistant built on Phonely.
## Features
- Resolve city names to IATA airport codes
- Search for mock flight availability
- Book flights and generate confirmation numbers
- Send confirmations via SMS (US numbers) or Email
- Answer policy questions via Knowledge Base
- Handle errors: unknown cities, invalid dates, no flights, support transfers

---

## Project Structure

```
airline-agent/
├── server.js                 # Express entry point
├── routes/
│   ├── airports.js           # POST /api/airports/resolve
│   ├── flights.js            # POST /api/flights/search
│   ├── bookings.js           # POST /api/bookings/create
│   └── notify.js             # POST /api/notify/send
├── data/
│   ├── airports.js           # IATA lookup map
│   ├── flights.js            # Mock flight generator
│   └── bookings.js           # In-memory booking store
├── knowledge-base.md         # Airline policies (upload to Phonely KB)
├── PHONELY_AGENT_PROMPT.md   # Full agent system prompt
└── package.json
```

---

## Local Setup

```bash
npm install
npm start
# Server runs on http://localhost:3000
```

---

## Deploy to Railway (Free)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo → Railway auto-detects Node.js
4. Copy the public URL (e.g. `https://airline-agent.up.railway.app`)

---

## API Reference

### Resolve Airport
```
POST /api/airports/resolve
{ "city": "Los Angeles" }
→ { "iata": "LAX", "found": true }
```

### Search Flights
```
POST /api/flights/search
{ "origin_city": "Los Angeles", "destination_city": "New York", "date": "2026-06-15" }
→ { flights: [...] }
```

### Create Booking
```
POST /api/bookings/create
{
  "flight_id": "SW101-2026-06-15",
  "origin": "LAX", "destination": "JFK", "date": "2026-06-15",
  "passenger": { "full_name": "Jane Doe", "contact": "jane@email.com" },
  "seat_class": "economy"
}
→ { confirmation_number: "A3K9MR", booking: {...} }
```

### Send Notification
```
POST /api/notify/send
{ "confirmation_number": "A3K9MR" }
→ { success: true, channel: "Email", sent_to: "jane@email.com" }
```

---

## Phonely Setup Steps

1. **Create a new agent** on Phonely
2. **Paste the system prompt** from `PHONELY_AGENT_PROMPT.md`
3. **Upload the knowledge base** — paste content from `knowledge-base.md`
4. **Add webhook tools** in Phonely for each API endpoint
5. **Configure transfer** — add a transfer destination for "customer support"
6. **Buy a number** (or use Google Voice for testing)
7. **Test** the full booking flow

---

## Test Cases

| Scenario | Input | Expected |
|----------|-------|----------|
| Normal booking | LAX → JFK, any future date | 2–4 flights shown |
| No flights (404) | AAL → YVR, any date | Error message |
| Unknown city | "Gotham" | Unknown airport error |
| Past date | Yesterday | Invalid date error |
| Transfer request | "Let me speak to someone" | Call transferred |
| Policy question | "What's your refund policy?" | KB answer |
