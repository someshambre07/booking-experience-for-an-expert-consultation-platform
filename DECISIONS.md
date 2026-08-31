# DECISIONS.MD — Product & Engineering Architecture

## 1. What product did you decide to build, and why?

**Product Name:** **Consult** — Instant & Scheduled Expert Consultation Platform

**The Domain & Interpretation:**
Given the one-line spec (*"a product where users browse experts, see who's available right now, and book a session"*), I chose to model a high-stakes marketplace for 30-minute paid advisory sessions across six high-value verticals:
1. **Tech & AI Systems Architecture** (LLM inference, agent scaling, GPU bottlenecks)
2. **Legal & Immigration** (O-1A/EB-1 visas, equity structuring, C-corp incorporation)
3. **Startup & VC Advisory** (Pitch deck audits, cap table modeling, SAFE notes)
4. **Tax & International Accounting** (83(b) elections, QSBS, crypto basis)
5. **Product & UX Strategy** (Conversion teardowns, activation funnels, design systems)
6. **Executive & Career Coaching** (Staff+ promotions, compensation negotiations)

**Why this interpretation?**
- **Real Constraint Density:** Advisory sessions carry real financial consequences ($130–$195 per 30 minutes), scarce slots (6–8 slots/day per expert), and distributed participants spanning North America, Europe, and Asia.
- **Urgent Live Availability:** The "available right now" requirement represents immediate triage needs (e.g., an urgent visa question before filing, a fundraising deck review before a partner meeting, or an outage in production AI infrastructure).
- **Architecture Priority:** Instead of shallow cosmetic screens, the focus is placed on ironclad reservation mechanics, cross-timezone coordinate conversion, atomic double-booking prevention, idempotency deduplication, and immediate booking lifecycle tracking with calendar exports.

---

## 2. What edge cases did you find?

| Edge Case | Status | Severity / Risk | Resolution & Implementation Details |
|---|---|---|---|
| **1. Simultaneous Slot Booking Race Condition** | **Handled** | **Critical (Double Booking)** | Handled atomically on backend. In our single-threaded Node.js execution loop, the check `slot.status === 'available'` and the transition `slot.status = 'booked'` are executed synchronously without interleaved `await`s. If two concurrent requests arrive for the exact same slot, the first succeeds with `201 Created` while the second is rejected immediately with `409 Conflict` (`SLOT_ALREADY_BOOKED`). In a distributed multi-instance SQL DB, this maps to `UPDATE slots SET status='booked' WHERE id=$1 AND status='available' RETURNING id` or a row-level lock (`SELECT ... FOR UPDATE`). |
| **2. Double-Tap / Network Retry Duplicate Submissions** | **Handled** | **High (Double Billing)** | Client mints a unique `idempotencyKey` when opening the slot checkout. If the user rapidly taps "Confirm Booking" or a mobile connection drops and retries, the backend detects the existing idempotency key in its map and idempotently returns the existing booking record (`200 OK` with `isReplay: true`) without creating a duplicate charge or record. |
| **3. Booking a Slot That Has Already Passed** | **Handled** | **High (Ghost Reservations)** | Client clocks cannot be trusted (users can adjust system clocks). The backend rejects any booking request where `new Date(slot.startTime).getTime() <= Date.now()` with `422 Unprocessable Entity` (`SLOT_IN_PAST`). We deliberately seeded past slots to test this live. |
| **4. Cross-Timezone Discrepancies** | **Handled** | **High (Missed Appointments)** | The API stores and transfers all timestamps exclusively in ISO-8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`). The UI automatically detects the client device timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` while allowing manual timezone switching. The booking dialog explicitly shows dual contextual timezones: *"Your time: 2:30 PM EDT (New York) · Expert's time: 11:30 AM PDT (San Francisco)"*. |
| **5. Currency Precision & Float Rounding Errors** | **Handled** | **Financial Risk** | All monetary amounts are stored strictly as integer cents (`ratePerSessionCents: 17500` = $175.00) alongside ISO currency codes (`USD`). Floating-point arithmetic (`0.1 + 0.2 !== 0.3`) is completely eliminated from the calculation layer. |
| **6. Consistent Error Envelope & Validation** | **Handled** | **Developer & Client Hygiene** | Every endpoint validates inputs (required fields, valid email regex, string limits) before touching business logic. All errors return a uniform contract: `{ success: false, error: { code: string, message: string, details?: any } }` with semantic HTTP status codes (`400`, `404`, `409`, `422`, `500`). |
| **7. Cancellation & Slot Inventory Recycling** | **Handled** | **Business Operations** | Endpoint `POST /api/bookings/:id/cancel` updates the booking to `cancelled`. If the appointment's start time is still in the future, it automatically flips the associated slot status back to `available` so other clients can book it immediately. |
| **8. Real-Time "Available Right Now" Definition** | **Handled** | **UX & Conversion** | "Available right now" is computed dynamically on the server and client as any slot whose start time is within `10 to 30 minutes` from `Date.now()`. Experts with immediate slots display a glowing live indicator and prominent quick-booking CTA. |
| **9. Ephemeral 2-Minute Slot Hold (Cart Locking)** | **Consciously Skipped** | **Medium UX Friction** | In production enterprise systems, opening a slot checkout temporarily locks the slot for 120 seconds with a TTL Redis key. Skipped for this exercise to avoid over-complicating client countdown timers; the 409 Conflict path guarantees correctness. |
| **10. Foreign Exchange (FX) Real-Time Conversion** | **Consciously Skipped** | **Financial Scope** | Experts charge in their native currency (`USD`). We display currency formats with `Intl.NumberFormat` but do not perform live multi-currency FX conversions against user bank exchange rates. |
| **11. Calendar .ICS & Video Room Generation** | **Handled** | **Post-Booking Experience** | Bookings generate unique video room URLs (`https://meet.consult.app/room/CNS-xxxx`) and provide instant one-click `.ics` Apple/Google/Outlook calendar file downloads with timezone headers and alarms. |

---

## 3. What did you deliberately not build, and what would you do with two more days?

### Deliberately Not Built (Scope Discipline):
- **Full Stripe / Payment Gateway Integration:** Skipped live credit card processing modals; the booking service calculates exact integer-cent charges and issues confirmed receipt tokens.
- **Persistent Cloud SQL / PostgreSQL Container:** In-memory store satisfies the brief with zero external infrastructure hurdles, while replicating relational constraints and seed automation.
- **Expert-Side Schedule Editor:** Focused exclusively on the buyer/client booking lifecycle ("one screen done exceptionally well" plus the appointment history).

### With 2 More Days:
1. **Persistent PostgreSQL + Drizzle ORM:** Replace in-memory Maps with a relational DB using `SELECT FOR UPDATE` and transactional isolation (`SERIALIZABLE`) to prove multi-instance DB locking.
2. **WebSocket / SSE Live Slot Availability Push:** Real-time push notifications so when Client A books 3:00 PM, Client B's screen instantly fades that slot out without page refreshes.
3. **Rescheduling Flow:** Allow clients to swap their confirmed slot to a different open slot with single-click re-indexing.
4. **Automated SMS & Email Webhooks:** Integrate Twilio/SendGrid for 15-minute SMS reminders before live sessions start.

---

## 4. What's the weakest part of your submission? (Honest Self-Assessment)

1. **In-Memory Volatility on Server Cold Restart:** If the container process restarts, all in-memory bookings reset back to seed data. A file-backed or SQLite store would give persistence between dev restarts without requiring external DB installation.
2. **Timezone Transition Edge Cases (DST Boundaries):** While ISO UTC timestamps eliminate 95% of timezone errors, recurring slot generation across Daylight Saving Time boundaries (e.g., standard time to daylight time shifts) requires an IANA zone database (`date-fns-tz` or `luxon`) to ensure 9:00 AM local time doesn't shift by an hour in October/March.
3. **No Slot Pre-Hold Expiration Sweeper:** If two users view the checkout modal simultaneously, both see the button active until one hits submit and the other receives the 409 Conflict toast.

---

## 5. What would you push back on if a PM handed you this brief at work?

1. **"What is the exact definition and SLA of 'Available Right Now'?"**
   - *Pushback:* Does "right now" mean an expert is sitting at their desk ready for an on-demand WebRTC ring (like Uber for consulting)? Or does it mean they have an open calendar slot within the next 30–60 minutes?
   - *Why:* On-demand instant calling requires live presence heartbeats, push notifications, accept/decline timers (e.g. 45s to answer), and fallback cancellation if the expert doesn't pick up. Scheduled slots within 30m only require standard calendar booking.
2. **"When does the financial charge capture happen?"**
   - *Pushback:* Are we authorizing cards at booking time and capturing post-session, or charging upfront with an escrow/refund policy if the expert no-shows?
   - *Why:* This dictates whether we need a 2-phase authorization engine, cancellation penalty matrix, and refund webhooks.
3. **"Where are meeting links generated?"**
   - *Pushback:* Do we provision custom Zoom/Google Meet OAuth links per expert, or route through an in-house embedded WebRTC room?
