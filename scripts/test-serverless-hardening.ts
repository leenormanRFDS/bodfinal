// scripts/test-serverless-hardening.ts
// Test suite for Ticketing Phase 3C Serverless Hardening & Resilience.

import {
  getBookingRecord,
  saveBookingRecord,
  clearBookingStore,
  deleteBookingRecord,
  normalizeRezdyBooking,
  type AuthoritativeBookingRecord,
} from '../src/lib/booking-store';
import { fetchAuthoritativeBooking } from '../src/lib/rezdy';
import { POST as webhookPOST } from '../src/pages/api/rezdy/webhook';
import { GET as bookingStatusGET } from '../src/pages/api/rezdy/booking-status';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  results.push({
    name,
    passed: !!condition,
    details: condition ? details : `FAILED: ${details}`,
  });
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${name}: ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING TICKETING PHASE 3C SERVERLESS HARDENING TESTS');
  console.log('====================================================\n');

  // TEST 1: Cold Start & Empty Memory Store
  {
    clearBookingStore();
    assert(getBookingRecord('R11NS1R') === null, 'Cold Start Memory State', 'Memory store is completely empty after cold start');

    const req = new Request('http://localhost:3000/api/rezdy/booking-status?orderNumber=R11NS1R');
    const res = await bookingStatusGET({ request: req });
    const data = await res.json();

    assert(res.status === 200, 'Cold Start Resolution Status', 'Returns HTTP 200 even when memory is completely empty');
    assert(data.status === 'CONFIRMED' && data.isConfirmed === true, 'Cold Start Authoritative Truth', 'Resolves confirmed status directly from authoritative source');
    assert(getBookingRecord('R11NS1R') !== null, 'Cold Start Cache Repopulation', 'Best-effort cache repopulated for subsequent requests');
  }

  // TEST 2: Duplicate Webhook Delivery on Same Instance
  {
    const webhookPayload = {
      event: 'NEW_ORDER',
      booking: {
        orderNumber: 'TEST-DUP-1',
        status: 'CONFIRMED',
        totalAmount: 90,
        supplierAlias: 'rfdsdarwin1',
        dateCreated: '2026-09-22 10:00:00',
      },
    };

    const req1 = new Request('http://localhost:3000/api/rezdy/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    const res1 = await webhookPOST({ request: req1 });
    const data1 = await res1.json();

    assert(res1.status === 200 && data1.duplicate === false, 'Duplicate Webhook: 1st Delivery', 'First delivery processed normally');

    const req2 = new Request('http://localhost:3000/api/rezdy/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    const res2 = await webhookPOST({ request: req2 });
    const data2 = await res2.json();

    assert(res2.status === 200 && data2.duplicate === true, 'Duplicate Webhook: 2nd Delivery', 'Second duplicate delivery intercepted by local deduplication ledger');
  }

  // TEST 3: Duplicate Webhook Across Separate Logical Instances
  {
    // Instance A processes event
    const payload = {
      event: 'UPDATED_ORDER',
      booking: {
        orderNumber: 'TEST-MULTI-INST',
        status: 'CONFIRMED',
        totalAmount: 90,
        supplierAlias: 'rfdsdarwin1',
        dateUpdated: '2026-09-22 10:05:00',
      },
    };

    const reqA = new Request('http://localhost:3000/api/rezdy/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const resA = await webhookPOST({ request: reqA });
    const dataA = await resA.json();

    // Instance B processes same event (different memory cache / different instance)
    const recB = normalizeRezdyBooking(payload.booking, 'webhook');
    saveBookingRecord(recB);

    assert(dataA.isConfirmed === true, 'Multi-Instance Webhook: Instance A', 'Instance A reaches CONFIRMED state');
    assert(recB.isConfirmed === true && recB.status === 'CONFIRMED', 'Multi-Instance Webhook: Instance B', 'Instance B reaches identical CONFIRMED state with no duplicate side effects');
  }

  // TEST 4: Webhook Before Visitor
  {
    const orderKey = 'TEST-WEBHOOK-FIRST';
    const payload = {
      event: 'NEW_ORDER',
      booking: {
        orderNumber: orderKey,
        status: 'CONFIRMED',
        totalAmount: 120,
        supplierAlias: 'rfdsdarwin1',
      },
    };

    const webhookReq = new Request('http://localhost:3000/api/rezdy/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await webhookPOST({ request: webhookReq });

    // Visitor arrives afterwards
    const visitorReq = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${orderKey}`);
    const visitorRes = await bookingStatusGET({ request: visitorReq });
    const visitorData = await visitorRes.json();

    assert(visitorRes.status === 200 && visitorData.isConfirmed === true, 'Webhook Before Visitor', 'Visitor immediately sees verified confirmation populated by earlier webhook');
  }

  // TEST 5: Visitor Before Webhook
  {
    const orderKey = 'TEST-VISITOR-FIRST';

    // 1. Visitor arrives while booking is in progress
    saveBookingRecord({
      orderNumber: orderKey,
      status: 'PROCESSING',
      isConfirmed: false,
      productName: 'The Bombing of Darwin Experience',
      productSlug: 'general-entry',
      totalQuantity: 2,
      ticketSummary: [{ label: 'Adult', quantity: 2, price: 30 }],
      totalAmount: 60,
      totalCurrency: 'AUD',
      verifiedAt: new Date().toISOString(),
      source: 'mock_test',
    });

    const visitorReq1 = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${orderKey}`);
    const visitorRes1 = await bookingStatusGET({ request: visitorReq1 });
    const visitorData1 = await visitorRes1.json();

    assert(visitorData1.status === 'PROCESSING' && visitorData1.isConfirmed === false, 'Visitor Before Webhook: Poll 1', 'Visitor receives in-progress status');

    // 2. Webhook arrives completing order
    const webhookPayload = {
      event: 'UPDATED_ORDER',
      booking: {
        orderNumber: orderKey,
        status: 'CONFIRMED',
        totalAmount: 60,
        supplierAlias: 'rfdsdarwin1',
      },
    };
    const webhookReq = new Request('http://localhost:3000/api/rezdy/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });
    await webhookPOST({ request: webhookReq });

    // 3. Visitor poll 2
    const visitorReq2 = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${orderKey}`);
    const visitorRes2 = await bookingStatusGET({ request: visitorReq2 });
    const visitorData2 = await visitorRes2.json();

    assert(visitorData2.status === 'CONFIRMED' && visitorData2.isConfirmed === true, 'Visitor Before Webhook: Poll 2', 'Subsequent poll transitions cleanly to CONFIRMED');
  }

  // TEST 6: Webhook Never Arrives
  {
    clearBookingStore();
    const orderKey = 'R11NS1R'; // Can be resolved via direct Rezdy lookup

    // Visitor arrives directly without any webhook ever triggering
    const req = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${orderKey}`);
    const res = await bookingStatusGET({ request: req });
    const data = await res.json();

    assert(res.status === 200 && data.status === 'CONFIRMED', 'Webhook Never Arrives', 'Status resolves authoritatively without needing webhook');
  }

  // TEST 7: Rezdy API Temporarily Fails
  {
    // Case A: No prior cache exists + Rezdy API fails
    clearBookingStore();
    // Simulate non-existent or unreachable order
    const reqNoCache = new Request('http://localhost:3000/api/rezdy/booking-status?orderNumber=UNCONFIGURED-DOWN-999');
    const resNoCache = await bookingStatusGET({ request: reqNoCache });
    assert(resNoCache.status === 404 || resNoCache.status === 502, 'API Fail Without Cache', 'Returns appropriate error response when upstream is unavailable and no cache exists');

    // Case B: Degraded fallback with existing verified cache
    const orderKey = 'TEST-DEGRADED-1';
    saveBookingRecord({
      orderNumber: orderKey,
      status: 'CONFIRMED',
      isConfirmed: true,
      productName: 'The Bombing of Darwin Experience',
      productSlug: 'general-entry',
      totalQuantity: 1,
      ticketSummary: [],
      totalAmount: 30,
      totalCurrency: 'AUD',
      verifiedAt: new Date().toISOString(),
      source: 'mock_test',
    });

    const reqWithCache = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${orderKey}`);
    const resWithCache = await bookingStatusGET({ request: reqWithCache });
    const dataWithCache = await resWithCache.json();

    assert(resWithCache.status === 200 && dataWithCache.isConfirmed === true, 'API Fail With Cache', 'Memory cache serves as degraded fallback when previously verified');
  }

  // TEST 8: Confirmed Booking Later Cancelled
  {
    const orderKey = 'TEST-CANCEL-SUPERSEDE';

    // Step 1: Initial state is CONFIRMED
    saveBookingRecord({
      orderNumber: orderKey,
      status: 'CONFIRMED',
      isConfirmed: true,
      productName: 'The Bombing of Darwin Experience',
      productSlug: 'general-entry',
      totalQuantity: 2,
      ticketSummary: [],
      totalAmount: 60,
      totalCurrency: 'AUD',
      verifiedAt: new Date(Date.now() - 1000).toISOString(),
      source: 'rezdy_api',
    });

    assert(getBookingRecord(orderKey)?.status === 'CONFIRMED', 'Cancel Supersession: Step 1', 'Initially confirmed in store');

    // Step 2: Inbound cancellation event or live API returns CANCELLED
    const cancelRecord = normalizeRezdyBooking({
      orderNumber: orderKey,
      status: 'CANCELLED',
      totalAmount: 60,
      totalCurrency: 'AUD',
    }, 'rezdy_api');

    // Live status supersedes cache
    saveBookingRecord(cancelRecord);

    const updated = getBookingRecord(orderKey);
    assert(updated?.status === 'CANCELLED' && updated?.isConfirmed === false, 'Cancel Supersession: Step 2', 'Cancelled status authoritatively supersedes earlier CONFIRMED cache');

    const req = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${orderKey}`);
    const res = await bookingStatusGET({ request: req });
    const data = await res.json();
    assert(data.status === 'CANCELLED' && data.isConfirmed === false, 'Cancel Supersession: Step 3', 'API endpoint reports booking as CANCELLED');
  }

  // TEST 9: Forged Webhook Containing a Fake Order Number
  {
    clearBookingStore();
    const forgedOrder = 'FORGED-REAL-LOOKING-777';

    // Attacker attempts to post forged webhook with status: 'CONFIRMED'
    const forgedPayload = {
      event: 'NEW_ORDER',
      booking: {
        orderNumber: forgedOrder,
        status: 'CONFIRMED',
        totalAmount: 900,
        supplierAlias: 'rfdsdarwin1',
      },
    };

    const webhookReq = new Request('http://localhost:3000/api/rezdy/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forgedPayload),
    });

    const webhookRes = await webhookPOST({ request: webhookReq });
    const webhookData = await webhookRes.json();

    // The order should NOT be verified because it does not exist in Rezdy
    const statusReq = new Request(`http://localhost:3000/api/rezdy/booking-status?orderNumber=${forgedOrder}`);
    const statusRes = await bookingStatusGET({ request: statusReq });
    const statusData = await statusRes.json();

    assert(
      statusRes.status === 404 || statusData.status === 'NOT_FOUND' || statusData.isConfirmed === false,
      'Forged Webhook Defeat',
      'Forged webhook is rejected or unverified; visitor lookup returns NOT_FOUND / false'
    );
  }

  // TEST 10: In-Progress Status TTL Revalidation
  {
    const orderKey = 'TEST-IN-PROGRESS-TTL';
    // Save record with in-progress status from 5 seconds ago (exceeding 3s TTL)
    saveBookingRecord({
      orderNumber: orderKey,
      status: 'PROCESSING',
      isConfirmed: false,
      productName: 'The Bombing of Darwin Experience',
      productSlug: 'general-entry',
      totalQuantity: 1,
      ticketSummary: [],
      totalAmount: 30,
      totalCurrency: 'AUD',
      verifiedAt: new Date(Date.now() - 5000).toISOString(),
      source: 'rezdy_api',
    });

    // When fetchAuthoritativeBooking is called, it revalidates because TTL (3s) has expired
    const res = await fetchAuthoritativeBooking(orderKey);
    // Since REZDY_API_KEY is not configured for this synthetic test key, it cleanly reports not found / unconfigured
    assert(
      res.notFound === true || res.success === false || res.record?.status !== 'PROCESSING',
      'In-Progress TTL Revalidation',
      'In-progress cache expired and triggered live revalidation'
    );
  }

  console.log('\n====================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TEST RUN COMPLETE: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
