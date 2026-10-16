// src/pages/api/products.ts
import { REZDY_PRODUCTS, getProductDetails } from '../../lib/rezdy';

export async function GET() {
  try {
    const productEntries = await Promise.all(
      Object.values(REZDY_PRODUCTS).map(async (def) => {
        const details = await getProductDetails(def);
        return [def.slug, details];
      })
    );

    const products = Object.fromEntries(productEntries);

    return new Response(
      JSON.stringify({
        count: Object.keys(products).length,
        products,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: String(err.message || 'upstream') }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }
    );
  }
}
