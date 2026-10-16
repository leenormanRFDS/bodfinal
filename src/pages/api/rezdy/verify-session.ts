// src/pages/api/rezdy/verify-session.ts
// Uncached live pre-flight availability check for exact session / date.
// Bypasses the 3-minute broad availability cache.
import { verifyExactSession } from '../../../lib/rezdy';

export async function POST({ request }: { request: Request }) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { productSlug, productCode, date, time, sessionId, requiredSeats, qty } = body;

    if (!date) {
      return new Response(
        JSON.stringify({
          available: false,
          reason: 'missing_date',
          message: 'Date is required for session verification.',
          seatsAvailable: 0,
          requiredSeats: Number(requiredSeats) || 1,
          isAllDay: false,
          productSlug: productSlug || 'general-entry',
          verifiedAt: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    const result = await verifyExactSession({
      productSlug,
      productCode,
      date,
      time,
      sessionId,
      requiredSeats: Number(requiredSeats) || undefined,
      qty,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        available: false,
        reason: 'server_error',
        message: String(err?.message || 'Verification error'),
        seatsAvailable: 0,
        requiredSeats: 1,
        isAllDay: false,
        productSlug: 'unknown',
        verifiedAt: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}

// Allow GET for lightweight query-param pre-flight probing if needed
export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const productSlug = url.searchParams.get('product') || url.searchParams.get('slug') || url.searchParams.get('productSlug') || undefined;
  const date = url.searchParams.get('date') || '';
  const time = url.searchParams.get('time') || undefined;
  const sessionId = url.searchParams.get('sessionId') || undefined;
  const requiredSeats = Number(url.searchParams.get('requiredSeats') || url.searchParams.get('seats')) || undefined;

  if (!date) {
    return new Response(
      JSON.stringify({ error: 'date query parameter required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }

  const result = await verifyExactSession({
    productSlug,
    date,
    time,
    sessionId,
    requiredSeats,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
