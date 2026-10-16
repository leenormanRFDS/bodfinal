// src/pages/api/availability.ts
import { resolveProductDef, getProductAvailability } from '../../lib/rezdy';

export async function GET({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const requested = url.searchParams.get('product') || url.searchParams.get('slug') || url.searchParams.get('productCode');
    const def = resolveProductDef(requested);
    const data = await getProductAvailability(def);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (data.mock) {
      headers['Cache-Control'] = 'no-store';
    } else {
      headers['Cache-Control'] = 's-maxage=180, stale-while-revalidate=300';
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: String(err.message || 'unknown_error'),
        mock: true,
        sessions: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }
    );
  }
}
