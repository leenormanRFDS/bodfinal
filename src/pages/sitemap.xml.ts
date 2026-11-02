import type { APIRoute } from 'astro';

// Built once at deploy time, served as static XML.
export const prerender = true;

// Always the www origin, so it matches the canonical URLs Base.astro emits
// (<link rel="canonical" href={Astro.url.href} />). Switch this to the apex
// domain when the apex move happens.
const ORIGIN = 'https://www.thebombingofdarwin.com.au';

// Every static .astro page under src/pages becomes a URL automatically.
// Dynamic routes (anything with [brackets]) and API routes are skipped, and so
// are pages that should not be indexed: the 404 page, the /book and /programs
// redirects, and the post-payment confirmation page. List extra paths in
// EXTRA_PATHS, and any new redirect or private page in EXCLUDE.
const modules = import.meta.glob('./**/*.astro');

const EXTRA_PATHS: string[] = [];
const EXCLUDE = new Set<string>(['/book', '/programs', '/tickets/confirmation']);

function toPath(file: string): string {
  let path = file.replace(/^\.\//, '').replace(/\.astro$/, '');
  if (path === 'index') return '/';
  path = path.replace(/\/index$/, '');
  return '/' + path;
}

const paths = Object.keys(modules)
  .filter((file) => !file.includes('[') && !file.includes('404'))
  .map(toPath)
  .filter((p) => !EXCLUDE.has(p))
  .concat(EXTRA_PATHS);

const unique = Array.from(new Set(paths)).sort();

export const GET: APIRoute = () => {
  const urls = unique.map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
