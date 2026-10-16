// src/pages/api/rezdy/booking-status.ts
// Authoritative booking status endpoint.
// Never trusts client query parameters or client-side storage.
// Verifies status directly from the Rezdy API or verified server-side store.
import { fetchAuthoritativeBooking } from '../../../lib/rezdy';

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('orderNumber') ||
    url.searchParams.get('orderRef') ||
    url.searchParams.get('bookingNumber') ||
    url.searchParams.get('reference') ||
    '';

  const cleanKey = orderNumber.trim().toUpperCase().replace(/^#/, '');

  if (!cleanKey) {
    return new Response(
      JSON.stringify({
        orderNumber: '',
        status: 'NO_REFERENCE',
        isConfirmed: false,
        message: 'A valid booking reference is required.',
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

  const result = await fetchAuthoritativeBooking(cleanKey);

  if (result.notFound) {
    return new Response(
      JSON.stringify({
        orderNumber: cleanKey,
        status: 'NOT_FOUND',
        isConfirmed: false,
        message: 'No booking was found matching this reference in the ticketing system.',
        verifiedAt: new Date().toISOString(),
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  if (!result.success || !result.record) {
    return new Response(
      JSON.stringify({
        orderNumber: cleanKey,
        status: 'UPSTREAM_ERROR',
        isConfirmed: false,
        message: result.error || 'Temporary issue communicating with the ticketing authority.',
        verifiedAt: new Date().toISOString(),
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  const rec = result.record;

  return new Response(
    JSON.stringify({
      orderNumber: rec.orderNumber,
      status: rec.status,
      isConfirmed: rec.isConfirmed,
      productName: rec.productName,
      productSlug: rec.productSlug,
      date: rec.date,
      time: rec.time,
      startTimeLocal: rec.startTimeLocal,
      totalQuantity: rec.totalQuantity,
      ticketSummary: rec.ticketSummary,
      totalAmount: rec.totalAmount,
      totalCurrency: rec.totalCurrency,
      barcode: rec.barcode || null,
      barcodeType: rec.barcodeType || null,
      verifiedAt: rec.verifiedAt,
      source: rec.source,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderNumber = body.orderNumber || body.orderRef || body.bookingNumber || '';
    const cleanKey = String(orderNumber).trim().toUpperCase().replace(/^#/, '');

    if (!cleanKey) {
      return new Response(
        JSON.stringify({
          orderNumber: '',
          status: 'NO_REFERENCE',
          isConfirmed: false,
          message: 'A valid booking reference is required in request body.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const result = await fetchAuthoritativeBooking(cleanKey);

    if (result.notFound) {
      return new Response(
        JSON.stringify({
          orderNumber: cleanKey,
          status: 'NOT_FOUND',
          isConfirmed: false,
          message: 'No booking was found matching this reference.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    if (!result.success || !result.record) {
      return new Response(
        JSON.stringify({
          orderNumber: cleanKey,
          status: 'UPSTREAM_ERROR',
          isConfirmed: false,
          message: result.error || 'Ticketing service unavailable.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    return new Response(
      JSON.stringify({
        orderNumber: result.record.orderNumber,
        status: result.record.status,
        isConfirmed: result.record.isConfirmed,
        productName: result.record.productName,
        productSlug: result.record.productSlug,
        date: result.record.date,
        time: result.record.time,
        startTimeLocal: result.record.startTimeLocal,
        totalQuantity: result.record.totalQuantity,
        ticketSummary: result.record.ticketSummary,
        totalAmount: result.record.totalAmount,
        totalCurrency: result.record.totalCurrency,
        barcode: result.record.barcode || null,
        barcodeType: result.record.barcodeType || null,
        verifiedAt: result.record.verifiedAt,
        source: result.record.source,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        isConfirmed: false,
        message: err?.message || 'Server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
}
