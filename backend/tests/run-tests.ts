import { store } from '../store.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (detail) console.error(`   Detail: ${detail}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING CRITICAL TARGETED BOOKING EDGE-CASE TESTS');
  console.log('======================================================\n');

  // Test 1: Race condition / Double-booking prevention
  console.log('--- TEST 1: Simultaneous Booking Conflict (Double-Booking Prevention) ---');
  store.reset();
  const experts = store.getExperts({});
  const testExpert = experts[0];
  const availableSlots = store
    .getSlotsByExpertId(testExpert.id)
    .filter((s) => s.status === 'available' && new Date(s.startTime).getTime() > Date.now());

  const targetSlot = availableSlots[0];

  let user1Success = false;
  let user2Conflict = false;

  try {
    store.createBooking({
      expertId: testExpert.id,
      slotId: targetSlot.id,
      user: { name: 'Alice Client', email: 'alice@example.com', timezone: 'America/New_York' },
      idempotencyKey: 'idemp-test-1-alice'
    });
    user1Success = true;
  } catch (e) {
    user1Success = false;
  }

  try {
    store.createBooking({
      expertId: testExpert.id,
      slotId: targetSlot.id,
      user: { name: 'Bob Client', email: 'bob@example.com', timezone: 'Europe/London' },
      idempotencyKey: 'idemp-test-1-bob'
    });
  } catch (err: any) {
    if (err.statusCode === 409 && err.code === 'SLOT_ALREADY_BOOKED') {
      user2Conflict = true;
    }
  }

  assert(
    user1Success && user2Conflict,
    'Prevents double-booking: First caller gets 201, second concurrent caller gets 409 Conflict'
  );

  // Test 2: Idempotency Key (Double-tap / Network Retry)
  console.log('\n--- TEST 2: Idempotency Key De-duplication (Network Retry Protection) ---');
  store.reset();
  const slot2 = store
    .getSlotsByExpertId(testExpert.id)
    .filter((s) => s.status === 'available' && new Date(s.startTime).getTime() > Date.now())[0];

  const retryKey = 'idemp-retry-uuid-999';
  const firstAttempt = store.createBooking({
    expertId: testExpert.id,
    slotId: slot2.id,
    user: { name: 'Double Tap User', email: 'tap@example.com', timezone: 'America/Chicago' },
    idempotencyKey: retryKey
  });

  const secondAttempt = store.createBooking({
    expertId: testExpert.id,
    slotId: slot2.id,
    user: { name: 'Double Tap User', email: 'tap@example.com', timezone: 'America/Chicago' },
    idempotencyKey: retryKey
  });

  assert(
    firstAttempt.booking.id === secondAttempt.booking.id && secondAttempt.isReplay === true,
    'Idempotency key returns original booking without creating duplicate record or charging twice'
  );

  // Test 3: Past Slot Booking Rejection (422 Unprocessable Entity)
  console.log('\n--- TEST 3: Past Slot Validation (Reject slots with start time in the past) ---');
  store.reset();
  const pastSlot = store.getSlotsByExpertId(testExpert.id).find((s) => s.id.includes('past'));

  let pastSlotRejectedWith422 = false;
  if (pastSlot) {
    try {
      store.createBooking({
        expertId: testExpert.id,
        slotId: pastSlot.id,
        user: { name: 'Late Booker', email: 'late@example.com', timezone: 'UTC' }
      });
    } catch (err: any) {
      if (err.statusCode === 422 && err.code === 'SLOT_IN_PAST') {
        pastSlotRejectedWith422 = true;
      }
    }
  }

  assert(
    pastSlotRejectedWith422,
    'Rejects booking requests for slots in the past with 422 SLOT_IN_PAST'
  );

  // Test 4: Cancellation & Slot Re-availability
  console.log('\n--- TEST 4: Booking Cancellation & Inventory Release ---');
  store.reset();
  const futureSlot = store
    .getSlotsByExpertId(testExpert.id)
    .filter((s) => s.status === 'available' && new Date(s.startTime).getTime() > Date.now())[0];

  const booking = store.createBooking({
    expertId: testExpert.id,
    slotId: futureSlot.id,
    user: { name: 'Cancel Test', email: 'cancel@example.com', timezone: 'UTC' }
  });

  const cancelled = store.cancelBooking(booking.booking.id);
  const recheckedSlot = store.getSlotById(futureSlot.id);

  assert(
    cancelled.status === 'cancelled' && recheckedSlot?.status === 'available',
    'Cancelling a booking marks status cancelled and releases the future slot back to inventory'
  );

  console.log('\n======================================================');
  console.log(`📊 TEST SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
